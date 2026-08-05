import ExcelJS from "exceljs";

export interface ExportMember {
  userId: string;
  name: string;
  role: string;
}

export interface ExportDay {
  date: string;
  meals: Record<string, number>;
  guestMeals: Record<string, number>;
  deposits: Record<string, number>;
  expenses: Record<string, number>;
  note: string;
}

export interface ExportMenuDay {
  date: string;
  lunch: string;
  dinner: string;
}

export interface BuildParams {
  messName: string;
  monthLabel: string;
  scope: "my" | "full";
  members: ExportMember[];
  days: ExportDay[];
  menus: ExportMenuDay[];
  mealRate: number;
  totalDeposits: number;
  totalExpenses: number;
}

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6A4FD8" } };
const TOTAL_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECE9FE" } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
const TOTAL_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FF1E2130" }, size: 11 };
const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE3E0F5" } },
  bottom: { style: "thin", color: { argb: "FFE3E0F5" } },
  left: { style: "thin", color: { argb: "FFE3E0F5" } },
  right: { style: "thin", color: { argb: "FFE3E0F5" } },
};

const MONEY_FMT = "#,##0.00";
const MEAL_FMT = "0.##";

function addTitle(ws: ExcelJS.Worksheet, text: string, cols: number) {
  const row = ws.addRow([text]);
  ws.mergeCells(row.number, 1, row.number, Math.max(cols, 1));
  row.height = 24;
  row.getCell(1).font = { size: 15, bold: true, color: { argb: "FF1E2130" } };
}

function addSubtitle(ws: ExcelJS.Worksheet, text: string, cols: number) {
  const row = ws.addRow([text]);
  ws.mergeCells(row.number, 1, row.number, Math.max(cols, 1));
  row.getCell(1).font = { size: 11, color: { argb: "FF8B8FA3" } };
}

function addHeaderRow(ws: ExcelJS.Worksheet, headers: string[]) {
  const row = ws.addRow(headers);
  row.height = 20;
  headers.forEach((_, i) => {
    const cell = row.getCell(i + 1);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = BORDER;
  });
  return row;
}

function styleBodyRow(
  row: ExcelJS.Row,
  opts: { numCols: number; numFmt: string; dateCol?: boolean }
) {
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.border = BORDER;
    if (opts.dateCol && col === 1) {
      cell.font = { bold: true, color: { argb: "FF1E2130" }, size: 10 };
      cell.alignment = { horizontal: "left" };
    } else if (col <= opts.numCols) {
      cell.alignment = { horizontal: "right" };
      if (typeof cell.value === "number") cell.numFmt = opts.numFmt;
    } else {
      cell.font = { color: { argb: "FF8B8FA3" }, size: 10 };
      cell.alignment = { horizontal: "left" };
    }
  });
}

function addTotalsRow(
  ws: ExcelJS.Worksheet,
  values: (string | number)[],
  opts: { numCols: number; numFmt: string }
) {
  const row = ws.addRow(values);
  row.height = 19;
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.fill = TOTAL_FILL;
    cell.font = TOTAL_FONT;
    cell.border = BORDER;
    if (col > 1 && col <= opts.numCols) {
      cell.alignment = { horizontal: "right" };
      if (typeof cell.value === "number") cell.numFmt = opts.numFmt;
    } else {
      cell.alignment = { horizontal: "left" };
    }
  });
  return row;
}

function addSubTotalRow(ws: ExcelJS.Worksheet, label: string, total: number, numFmt: string) {
  const row = ws.addRow([label, total]);
  row.height = 19;
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.fill = TOTAL_FILL;
    cell.font = { ...TOTAL_FONT, italic: true };
    cell.border = BORDER;
    if (col === 2) {
      cell.alignment = { horizontal: "right" };
      if (typeof cell.value === "number") cell.numFmt = numFmt;
    } else {
      cell.alignment = { horizontal: "left" };
    }
  });
}

interface MatrixSheetOpts {
  sheetName: string;
  subtitle: string;
  messName: string;
  members: ExportMember[];
  days: ExportDay[];
  pick: (d: ExportDay) => Record<string, number>;
  numFmt: string;
  withNote?: boolean;
  totalLabel: string;
  monthLabel: string;
}

function addMatrixSheet(wb: ExcelJS.Workbook, opts: MatrixSheetOpts) {
  const headers = ["Date", ...opts.members.map((m) => m.name), ...(opts.withNote ? ["Notes"] : [])];
  const numCols = headers.length;

  const ws = wb.addWorksheet(opts.sheetName);
  ws.columns = [
    { width: 13 },
    ...opts.members.map(() => ({ width: 12 })),
    ...(opts.withNote ? [{ width: 30 }] : []),
  ];

  addTitle(ws, `Mess Meal Management System — ${opts.messName}`, numCols);
  addSubtitle(ws, `${opts.subtitle} — ${opts.monthLabel}`, numCols);
  ws.addRow([]);
  addHeaderRow(ws, headers);

  for (const d of opts.days) {
    const values: (string | number)[] = [
      d.date,
      ...opts.members.map((m) => opts.pick(d)[m.userId] ?? 0),
      ...(opts.withNote ? [d.note] : []),
    ];
    const row = ws.addRow(values);
    styleBodyRow(row, { numCols, numFmt: opts.numFmt, dateCol: true });
  }

  const totals = opts.members.map((m) =>
    opts.days.reduce((s, d) => s + (opts.pick(d)[m.userId] || 0), 0)
  );
  addTotalsRow(ws, [opts.totalLabel, ...totals, ...(opts.withNote ? [""] : [])], {
    numCols,
    numFmt: opts.numFmt,
  });
  addSubTotalRow(
    ws,
    "Sub Total",
    totals.reduce((s, t) => s + t, 0),
    opts.numFmt
  );
  return ws;
}

function addSummarySheet(wb: ExcelJS.Workbook, params: BuildParams) {
  const headers = ["Name", "Role", "Meals", "Guest Meals", "Deposit", "Expense", "Balance"];
  const numCols = headers.length;

  const ws = wb.addWorksheet("Summary");
  ws.columns = [
    { width: 20 },
    { width: 13 },
    { width: 11 },
    { width: 13 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
  ];

  addTitle(ws, `Mess Meal Management System — ${params.messName}`, numCols);
  addSubtitle(ws, `Final Report — ${params.monthLabel} (${params.scope === "full" ? "Full Mess Log" : "My Log"})`, numCols);
  ws.addRow([]);
  addHeaderRow(ws, headers);

  const rowValues: (string | number)[][] = [];
  for (const m of params.members) {
    const meals = params.days.reduce((s, d) => s + (d.meals[m.userId] || 0), 0);
    const guestMeals = params.days.reduce((s, d) => s + (d.guestMeals[m.userId] || 0), 0);
    const deposit = params.days.reduce((s, d) => s + (d.deposits[m.userId] || 0), 0);
    const expense = meals * params.mealRate;
    const balance = deposit - expense;
    rowValues.push([m.name, m.role, meals, guestMeals, deposit, expense, balance]);
  }

  for (const values of rowValues) {
    const row = ws.addRow(values);
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = BORDER;
      cell.font = { size: 11, color: { argb: "FF1E2130" } };
      if (col === 1) {
        cell.font = { bold: true, size: 11, color: { argb: "FF1E2130" } };
        cell.alignment = { horizontal: "left" };
      } else if (col === 2) {
        cell.font = { size: 10, color: { argb: "FF8B8FA3" } };
        cell.alignment = { horizontal: "left" };
      } else {
        cell.alignment = { horizontal: "right" };
        cell.numFmt = col === 3 || col === 4 ? MEAL_FMT : MONEY_FMT;
      }
    });
  }

  if (params.scope === "full") {
    const sums = rowValues.reduce(
      (acc: number[], v) => {
        acc[2] += Number(v[2]);
        acc[3] += Number(v[3]);
        acc[4] += Number(v[4]);
        acc[5] += Number(v[5]);
        acc[6] += Number(v[6]);
        return acc;
      },
      [0, 0, 0, 0, 0, 0, 0]
    );
    const totalRow = addTotalsRow(ws, ["Total", "", ...sums.slice(2)], { numCols: numCols - 1, numFmt: MONEY_FMT });
    totalRow.getCell(3).numFmt = MEAL_FMT;
    totalRow.getCell(4).numFmt = MEAL_FMT;
  }

  ws.addRow([]);
  const rateRow = ws.addRow(["Meal Rate", params.mealRate]);
  rateRow.getCell(2).numFmt = MONEY_FMT;
  rateRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF1E2130" } };
  rateRow.getCell(2).font = { bold: true, size: 12, color: { argb: "FFF2A03D" } };

  const remaining = params.totalDeposits - params.totalExpenses;
  const balRow = ws.addRow(["Remaining Balance for Bazar", remaining]);
  balRow.getCell(2).numFmt = MONEY_FMT;
  balRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF1E2130" } };
  balRow.getCell(2).font = { bold: true, size: 12, color: { argb: remaining < 0 ? "FFE5484D" : "FF12B76A" } };

  return ws;
}

function addMenuSheet(wb: ExcelJS.Workbook, params: BuildParams) {
  const headers = ["Date", "Lunch", "Dinner"];
  const numCols = 3;

  const ws = wb.addWorksheet("Menu");
  ws.columns = [{ width: 13 }, { width: 40 }, { width: 40 }];

  addTitle(ws, `Mess Meal Management System — ${params.messName}`, numCols);
  addSubtitle(ws, `Menu — ${params.monthLabel}`, numCols);
  ws.addRow([]);
  addHeaderRow(ws, headers);

  if (params.menus.length === 0) {
    const row = ws.addRow(["No menu recorded for this month"]);
    ws.mergeCells(row.number, 1, row.number, numCols);
    row.getCell(1).font = { italic: true, color: { argb: "FF8B8FA3" }, size: 11 };
    return ws;
  }

  for (const m of params.menus) {
    const row = ws.addRow([m.date, m.lunch || "-", m.dinner || "-"]);
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = BORDER;
      cell.font = { size: 11, color: { argb: "FF1E2130" } };
      if (col === 1) {
        cell.font = { bold: true, size: 10, color: { argb: "FF1E2130" } };
        cell.alignment = { horizontal: "left" };
      } else {
        cell.alignment = { horizontal: "left", wrapText: true };
      }
    });
  }
  return ws;
}

export async function buildWorkbook(params: BuildParams): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MMS";
  wb.created = new Date();

  addSummarySheet(wb, params);
  addMatrixSheet(wb, {
    sheetName: "Meals",
    subtitle: "Eating Meal",
    messName: params.messName,
    members: params.members,
    days: params.days,
    pick: (d) => d.meals,
    numFmt: MEAL_FMT,
    totalLabel: "Total Meal",
    monthLabel: params.monthLabel,
  });
  addMatrixSheet(wb, {
    sheetName: "Guest Meals",
    subtitle: "Guest Meal",
    messName: params.messName,
    members: params.members,
    days: params.days,
    pick: (d) => d.guestMeals,
    numFmt: MEAL_FMT,
    totalLabel: "Total Guest Meal",
    monthLabel: params.monthLabel,
  });
  addMatrixSheet(wb, {
    sheetName: "Deposits",
    subtitle: "Deposit Money for Bazar",
    messName: params.messName,
    members: params.members,
    days: params.days,
    pick: (d) => d.deposits,
    numFmt: MONEY_FMT,
    totalLabel: "Total Deposit",
    monthLabel: params.monthLabel,
  });
  addMatrixSheet(wb, {
    sheetName: "Expenses",
    subtitle: "Shopping Expense",
    messName: params.messName,
    members: params.members,
    days: params.days,
    pick: (d) => d.expenses,
    numFmt: MONEY_FMT,
    withNote: true,
    totalLabel: "Total Expense",
    monthLabel: params.monthLabel,
  });
  addMenuSheet(wb, params);

  return wb.xlsx.writeBuffer();
}

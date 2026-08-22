import { hashPassword, verifyPassword } from "@/lib/auth";

jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue("mock-jwt-token"),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: { id: "test-id", email: "test@test.com", name: "Test" },
  }),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

jest.mock("@/lib/db", () => ({
  queryOne: jest.fn(),
}));

describe("Password Hashing", () => {
  it("should hash a password", async () => {
    const hash = await hashPassword("mypassword123");
    expect(hash).toBeDefined();
    expect(hash).not.toBe("mypassword123");
    expect(hash).toMatch(/^\$2[aby]?\$/);
  });

  it("should verify a correct password", async () => {
    const hash = await hashPassword("mypassword123");
    const result = await verifyPassword("mypassword123", hash);
    expect(result).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const hash = await hashPassword("mypassword123");
    const result = await verifyPassword("wrongpassword", hash);
    expect(result).toBe(false);
  });

  it("should produce different hashes for the same password", async () => {
    const hash1 = await hashPassword("mypassword123");
    const hash2 = await hashPassword("mypassword123");
    expect(hash1).not.toBe(hash2);
  });
});

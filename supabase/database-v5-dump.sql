--
-- PostgreSQL database dump
--

\restrict BHdblyNngfVKoeJAUxpYlrS3hCy6l15TUmIDwqy31NfZ0HGdMx5YYWxjbbDkLiC

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: create_mess(text, text, uuid); Type: FUNCTION; Schema: public; Owner: mmsuser
--

CREATE FUNCTION public.create_mess(p_name text, p_mess_code text, p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_mess JSONB;
BEGIN
  INSERT INTO public.messes (name, mess_code, created_by)
  VALUES (p_name, p_mess_code, p_user_id)
  RETURNING to_jsonb(messes.*) INTO v_mess;

  INSERT INTO public.memberships (user_id, mess_id, role, status)
  VALUES (p_user_id, (v_mess->>'id')::UUID, 'manager', 'active');

  RETURN v_mess;
END;
$$;


ALTER FUNCTION public.create_mess(p_name text, p_mess_code text, p_user_id uuid) OWNER TO mmsuser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bazar_duties; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.bazar_duties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mess_id uuid NOT NULL,
    user_id uuid NOT NULL,
    assigned_date date DEFAULT CURRENT_DATE NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT bazar_duties_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text])))
);


ALTER TABLE public.bazar_duties OWNER TO mmsuser;

--
-- Name: bazar_expenses; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.bazar_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mess_id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    date date NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bazar_expenses OWNER TO mmsuser;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mess_id uuid NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'General'::text NOT NULL,
    phone text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.contacts OWNER TO mmsuser;

--
-- Name: deposits; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.deposits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mess_id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    date date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.deposits OWNER TO mmsuser;

--
-- Name: events; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mess_id uuid NOT NULL,
    author_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    event_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.events OWNER TO mmsuser;

--
-- Name: freezer_stock; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.freezer_stock (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mess_id uuid NOT NULL,
    item text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit text DEFAULT 'kg'::text,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.freezer_stock OWNER TO mmsuser;

--
-- Name: meal_entries; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.meal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mess_id uuid NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    slot text NOT NULL,
    quantity numeric(4,2) NOT NULL,
    is_guest boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT meal_entries_quantity_check CHECK ((quantity >= (0)::numeric)),
    CONSTRAINT meal_entries_slot_check CHECK ((slot = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text])))
);


ALTER TABLE public.meal_entries OWNER TO mmsuser;

--
-- Name: memberships; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mess_id uuid NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    joined_at timestamp with time zone DEFAULT now(),
    moderator_from date,
    moderator_until date,
    CONSTRAINT memberships_role_check CHECK ((role = ANY (ARRAY['manager'::text, 'moderator'::text, 'member'::text]))),
    CONSTRAINT memberships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'left'::text])))
);


ALTER TABLE public.memberships OWNER TO mmsuser;

--
-- Name: menus; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mess_id uuid NOT NULL,
    date date NOT NULL,
    breakfast text,
    lunch text,
    dinner text
);


ALTER TABLE public.menus OWNER TO mmsuser;

--
-- Name: messes; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.messes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    mess_code text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.messes OWNER TO mmsuser;

--
-- Name: notices; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.notices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mess_id uuid NOT NULL,
    author_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    target_type text DEFAULT 'all'::text,
    target_user_ids uuid[],
    edited_at timestamp with time zone
);


ALTER TABLE public.notices OWNER TO mmsuser;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mess_id uuid NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    edited_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO mmsuser;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    name text NOT NULL,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.profiles OWNER TO mmsuser;

--
-- Name: requests; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mess_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT requests_type_check CHECK ((type = ANY (ARRAY['meal_off'::text, 'meal_on'::text, 'guest_meal'::text, 'join'::text, 'stock_access'::text, 'leave'::text])))
);


ALTER TABLE public.requests OWNER TO mmsuser;

--
-- Name: users; Type: TABLE; Schema: public; Owner: mmsuser
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO mmsuser;

--
-- Data for Name: bazar_duties; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.bazar_duties (id, mess_id, user_id, assigned_date, status, completed_at, created_at) FROM stdin;
27c3bc1b-e687-4f87-a048-f5635e2186df	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-06	completed	2026-08-01 17:04:38.807595+06	2026-08-01 16:44:11.869169+06
75bdc686-a954-4b97-b0a4-23de70b013a4	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-01	pending	\N	2026-08-01 17:54:05.386019+06
111bb4e5-9489-405c-996c-f4bf5caa8369	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-02	completed	2026-08-04 22:59:37.719448+06	2026-08-02 16:30:22.663865+06
\.


--
-- Data for Name: bazar_expenses; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.bazar_expenses (id, mess_id, user_id, amount, date, notes, created_at) FROM stdin;
f259696f-fe23-4993-8704-bf33084323b2	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	400.00	2026-07-31	sdfed	2026-07-31 17:57:30.262488+06
e63f4b14-7462-4144-8ef6-405c723ecdd8	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2000.00	2026-07-29	mach murgi	2026-07-31 18:32:40.864272+06
8a6718d4-ec33-401d-bf1a-8e79d351f203	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	1000.00	2026-07-31	\N	2026-07-31 22:18:17.996915+06
160eaa5a-646b-4bbb-84a7-97ec84663e24	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	10000.00	2026-08-01	\N	2026-08-01 13:56:27.976715+06
9a4f230d-fe36-49c3-a104-c54f81568f93	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	500.00	2026-08-06	ghjhgkj	2026-08-01 17:04:38.804005+06
5ce049cd-6794-4d08-a3dc-4c88fa1ac6d5	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	1460.00	2026-08-01	Chicken, oil, rice, vegetables, spices, salt, soya bean, dry fish	2026-08-02 00:07:23.327626+06
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.contacts (id, mess_id, name, category, phone, description, sort_order, created_at) FROM stdin;
b48b46fe-7203-488d-992d-4cd16964ba7f	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	Roman	Roman > Khala 	01770056748	Khalar Personal Mobile Nai	1	2026-08-04 22:58:44.878926+06
\.


--
-- Data for Name: deposits; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.deposits (id, mess_id, user_id, amount, date, created_at) FROM stdin;
27723cc7-2259-48b9-ba3e-f4d78a56ca59	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	500.00	2026-07-31	2026-07-31 15:24:08.447368+06
6b343502-1a99-46f7-82fb-00dcdc4e39c6	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2000.00	2026-07-31	2026-07-31 18:29:35.729768+06
b9721b35-6482-4fa0-a297-37a8f9b85690	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	1000.00	2026-07-22	2026-07-31 22:17:21.889225+06
a54126f9-8599-469a-8cd1-91662960be1e	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2000.00	2026-08-01	2026-08-01 12:27:03.476698+06
32683dd1-0bb3-40da-821f-50fa58e794c5	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	20000.00	2026-08-01	2026-08-01 13:56:13.56549+06
94e95724-fd85-4a72-b85b-9058e741f1bd	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	20000.00	2026-08-01	2026-08-01 14:12:24.007632+06
b37d9462-bd29-436f-a140-f1327b6f47c5	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2000.00	2026-08-01	2026-08-02 00:05:41.081506+06
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.events (id, mess_id, author_id, title, description, event_date, created_at) FROM stdin;
5971ba47-2555-4284-9224-e565ded343df	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	event test	birthday celebration	2026-08-06	2026-08-04 23:11:12.117753+06
\.


--
-- Data for Name: freezer_stock; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.freezer_stock (id, mess_id, item, quantity, unit, updated_at) FROM stdin;
5be859e7-44fb-42c1-8729-35205c1c85fe	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	Eggs	12.00	piece	2026-07-31 17:48:23.55428+06
ee2cc8be-b985-4841-940b-7c520c1c46fd	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	vegetables	1.00	kg	2026-07-31 17:48:55.883554+06
40599de1-2ad0-4eb4-b78d-e76517f9b9aa	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	Dheros	1.00	kg	2026-07-31 17:49:17.626396+06
b60b7f9d-3754-4179-8a03-a89226f0bdf1	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	xyz	3.00	kg	2026-07-31 17:50:02.161369+06
441a7274-de37-4ef9-9274-e0a0d738f7c1	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	Fish	3.00	kg	2026-07-31 17:50:39.391255+06
5b1eff1b-8b52-4990-93cf-12c69af8290c	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	Biriani	5.00	kg	2026-07-31 17:51:28.68186+06
54da2e2b-9e67-4725-b2e2-a78ef6608805	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	Oil	5.00	kg	2026-07-31 17:51:55.442339+06
70e27a4c-f2d4-40cc-a77b-86dfab56380b	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	Beef	1.00	kg	2026-07-31 17:52:20.627367+06
d266f133-3c04-4727-96d7-3acb42c49e7e	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	Mutton	4.00	kg	2026-07-31 22:15:44.933128+06
dfd8e686-6c64-43a0-bc79-b19bdf01df16	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	Chicken	10.00	p/s	2026-08-02 00:10:45.14158+06
6c4c3389-a2db-402c-8e4c-dce78bca57fa	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	Oid	1.00	ltr	2026-08-02 00:10:58.916945+06
40c390d4-ea59-49e2-a872-02d78e3b276b	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	Soya bean	1.00	kg	2026-08-02 00:11:16.29122+06
e5b8141a-6d91-403a-a09f-201ea65557bc	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	Vegetables	2.00	kg	2026-08-02 00:11:26.57016+06
\.


--
-- Data for Name: meal_entries; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.meal_entries (id, mess_id, user_id, date, slot, quantity, is_guest, created_at) FROM stdin;
cf7563b2-3be1-40de-b6fa-da58cb351107	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-31	lunch	1.00	t	2026-07-31 19:09:53.79041+06
8f31454c-047b-4c68-b3fb-a52e6bdc8a8a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-31	lunch	2.00	t	2026-07-31 19:09:53.79041+06
897426b8-01c9-4ac4-a952-5c102e19fb8c	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-31	dinner	2.00	t	2026-07-31 19:09:53.79041+06
ec7966af-ba61-4239-b520-aebef380d7e7	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-31	dinner	0.75	t	2026-07-31 19:09:53.79041+06
93a0817b-09f2-4eb0-8db3-ea4d57591668	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-26	lunch	1.00	f	2026-07-31 19:23:17.171234+06
9cb89085-898f-4da6-bec4-0c46689240ff	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-26	dinner	1.00	f	2026-07-31 19:23:17.177805+06
cfa86e79-f5f2-471f-bd76-36f74fd60d12	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-26	lunch	1.00	f	2026-07-31 19:23:17.179589+06
1d5039df-1ffc-4242-880d-7c91cb77550d	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-26	dinner	1.00	f	2026-07-31 19:23:17.181686+06
2acbea2e-119c-4336-8ad4-6e47091a8210	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-26	lunch	1.00	f	2026-07-31 19:23:17.183644+06
f0a8cdff-b416-4832-855e-9a168179dc60	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-26	dinner	1.00	f	2026-07-31 19:23:17.185684+06
be75a11f-d96c-4e07-9633-3f9c9c6bbeca	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-26	lunch	1.00	f	2026-07-31 19:23:17.187614+06
ea942c53-d8f8-4387-b7ed-1ad454035ee5	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-26	dinner	1.00	f	2026-07-31 19:23:17.189683+06
e0e66ce2-24e1-4244-a038-615364ff7251	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-20	lunch	2.00	f	2026-07-31 20:59:43.8286+06
b891bd29-a1f9-4f54-89b0-da3ff0b2ba9e	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-20	dinner	0.50	f	2026-07-31 20:59:43.835018+06
329eec58-63da-44c5-aded-cdb811c6bc1e	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-20	lunch	1.50	f	2026-07-31 20:59:43.836852+06
f0b6957f-e64a-4d89-9c39-9ac781520446	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-20	dinner	1.00	f	2026-07-31 20:59:43.838911+06
f62ab716-421e-40e4-b738-2c0f4ea4ad86	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-20	lunch	1.00	f	2026-07-31 20:59:43.840915+06
8a3e8dab-5bab-428b-8bd0-14a62cfac73c	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-20	dinner	1.50	f	2026-07-31 20:59:43.842999+06
a249469d-6ba5-40af-9106-f66dcefdd1e5	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-20	lunch	0.50	f	2026-07-31 20:59:43.844936+06
b7ef6561-1916-4edc-baaa-46968e969f5e	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-20	dinner	1.50	f	2026-07-31 20:59:43.847246+06
e664f5ff-c174-4b28-896f-1959e060621f	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-13	lunch	2.00	f	2026-07-31 21:03:17.207284+06
39af5811-8aab-46b3-b446-7fca893864f8	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-13	dinner	1.00	f	2026-07-31 21:03:17.213814+06
6c6cb1a2-3b82-4ea9-aef6-f0e4c2ee070a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-13	lunch	1.00	f	2026-07-31 21:03:17.215819+06
f78318c1-89d5-41d6-ad5b-568da763557b	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-13	dinner	1.00	f	2026-07-31 21:03:17.217759+06
352eef3d-437a-459e-932d-5ef3fd30819c	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-13	lunch	1.00	f	2026-07-31 21:03:17.219829+06
57f6f726-3f68-4f99-850f-caeea6fae5a0	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-13	dinner	1.00	f	2026-07-31 21:03:17.221742+06
ed3fcab2-7cc7-4c8b-bd76-d6af4044a14d	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-13	lunch	1.00	f	2026-07-31 21:03:17.223826+06
6b3ed1f1-c0c6-4a4d-b111-4ab27c7c35bf	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-13	dinner	1.00	f	2026-07-31 21:03:17.225776+06
fafa6311-7e79-4448-9a13-03c02ed73a06	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-15	lunch	1.00	f	2026-07-31 21:03:34.388666+06
c740c62f-c3c4-46db-81a4-67ee9fb325ba	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-15	dinner	1.00	f	2026-07-31 21:03:34.394073+06
ae6d6342-da14-403a-967d-a6c806d6d1ff	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-15	lunch	1.00	f	2026-07-31 21:03:34.396098+06
0289924d-2718-4be2-a14b-c7d1de10d393	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-15	dinner	1.00	f	2026-07-31 21:03:34.398128+06
412d63ac-95ae-4ae4-aeed-b5ce84d55c44	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-15	lunch	1.00	f	2026-07-31 21:03:34.400138+06
c62d90be-d211-4f58-8ec5-5c75e39bd0e4	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-15	dinner	1.00	f	2026-07-31 21:03:34.402129+06
7639a700-a9be-4dcd-89f6-6fc9a907668f	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-15	lunch	1.00	f	2026-07-31 21:03:34.404176+06
21195c4c-a962-4f3b-bb3f-4bf798ef750e	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-15	dinner	2.00	f	2026-07-31 21:03:34.406063+06
f926f84e-d15f-4651-a4e2-4becca22e62a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-02	lunch	1.15	f	2026-07-31 21:06:06.019693+06
31b5147e-0e22-4819-b175-7791a39631fd	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-02	dinner	1.00	f	2026-07-31 21:06:06.026309+06
1b76ab6e-fddd-41b8-bb57-6903fd26b8ed	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-02	lunch	1.00	f	2026-07-31 21:06:06.029195+06
353e4a9a-add5-4383-9d35-7c961617f018	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-02	dinner	1.00	f	2026-07-31 21:06:06.031059+06
dc2c3a6f-2247-4fc7-9ed5-cb9809843c80	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-02	lunch	1.13	f	2026-07-31 21:06:06.03314+06
0d1cc329-321e-4590-8429-132ce78b7fb9	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-02	dinner	1.00	f	2026-07-31 21:06:06.03505+06
27353b3d-e67d-4e16-9a1f-c1b2ee845a46	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-29	lunch	1.00	f	2026-07-31 18:22:10.933449+06
1c0e68e9-ed8d-460d-ae81-8c2c25dc4386	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-31	dinner	1.50	f	2026-07-31 18:21:28.311517+06
c5028232-f398-4dc2-8474-d7df275da503	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-31	lunch	1.00	f	2026-07-31 18:21:28.313571+06
e1fbdd1e-c25f-4e49-9d5c-8b09eb80eed2	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-29	dinner	1.00	f	2026-07-31 18:22:10.939313+06
3a57d2f2-9891-4876-90d2-6276f91a50fb	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-31	dinner	2.50	f	2026-07-31 18:21:28.303596+06
05b020f8-eecb-4da6-993f-2a5b01dc983e	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-29	lunch	1.50	f	2026-07-31 18:22:10.942257+06
72190c7c-2243-492a-b1fb-bc72fe140f90	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-31	lunch	3.00	f	2026-07-31 18:21:28.297824+06
305c1936-10de-46c5-bf69-4aa88d55e8c8	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-31	lunch	1.00	f	2026-07-31 18:21:28.305572+06
5b685402-baae-46ad-806b-978ccc9b53a4	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-31	dinner	1.00	f	2026-07-31 18:21:28.307644+06
fe92c687-703a-4b4a-899d-dd8e3043e6e3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-31	dinner	1.00	f	2026-07-31 18:21:28.315495+06
14f50b63-a58f-4196-93b3-483235890967	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-29	dinner	1.50	f	2026-07-31 18:22:10.945282+06
d150fa27-ca9c-47a4-80fd-bb7bcbfacfd1	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-29	lunch	1.00	f	2026-07-31 18:22:10.947242+06
4f401921-9a84-4335-b52b-9127eaa1e430	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-29	dinner	1.00	f	2026-07-31 18:22:10.949222+06
7e028dad-7e03-4863-b8dd-6ad36e58d78b	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-29	lunch	1.50	f	2026-07-31 18:22:10.951135+06
2841a449-4d8a-408f-b8e8-7833b4f17493	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-29	dinner	2.00	f	2026-07-31 18:22:10.95328+06
8044637b-eb91-4986-b323-dd32c56dea0a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-28	lunch	1.00	f	2026-07-31 19:22:10.255183+06
c52dd3d5-0479-4781-bc11-58f0d5a96ed9	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-28	dinner	1.00	f	2026-07-31 19:22:10.25876+06
fc678acb-04c9-4c43-bdc9-0e3363ed1672	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-28	lunch	1.00	f	2026-07-31 19:22:10.260861+06
fafdd086-5a50-4ca8-829d-d3916cb1f58f	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-07-28	dinner	1.00	f	2026-07-31 19:22:10.263809+06
29a613f3-ffbd-41c3-96ce-743aea8e5d23	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-28	lunch	2.00	f	2026-07-31 20:43:36.288002+06
5e068fa4-de73-4d32-9a6a-c427d64cb6b2	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-07-28	dinner	1.00	f	2026-07-31 19:22:10.267808+06
5291cdb5-1ccc-4fba-bf30-4160c1534bf7	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-28	lunch	1.00	f	2026-07-31 19:22:10.269762+06
fec0f466-be28-46e3-bfb6-af24134e9b60	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-28	dinner	1.00	f	2026-07-31 19:22:10.271712+06
1e4177b2-4ed5-4a38-8395-37aca4fdf614	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-04	lunch	1.50	t	2026-07-31 19:15:25.720075+06
244f2bb4-4dc9-4f76-870a-57ff04516420	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-04	dinner	1.00	t	2026-07-31 19:15:25.723191+06
38672ede-885d-4222-b9ef-9f7c0aabb261	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-02	lunch	1.00	f	2026-07-31 21:06:06.037177+06
f34cdef1-6bc0-4ae8-816c-ef60e251389d	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-07-02	dinner	1.00	f	2026-07-31 21:06:06.040185+06
dd29f1fa-a4cf-4275-bd56-95a6277b677a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-27	dinner	1.00	f	2026-07-31 22:53:17.344459+06
20046d58-f56c-41a0-ac98-8a992ebfac69	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-07-27	lunch	1.00	f	2026-07-31 22:53:17.352523+06
df99cd3b-cc3c-4aae-807f-2bda80c20125	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-01	lunch	1.00	t	2026-08-01 13:55:16.072841+06
ba610e7c-36ad-44a2-8e22-d21d9ffbd308	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-08-01	lunch	1.00	t	2026-08-01 13:55:16.07934+06
bb624183-be70-4073-9a9a-07874b681f72	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-08-01	lunch	1.00	t	2026-08-01 13:55:16.083163+06
a11b5ae4-86cb-4bcd-8d78-c3527a339879	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-01	lunch	1.00	t	2026-08-01 13:55:16.086148+06
7b90e269-6101-4af6-9705-66a9ff06d855	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-01	lunch	1.00	t	2026-08-01 13:55:16.089123+06
892f9cfa-77c5-4999-90e8-0275dc9506b7	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-01	lunch	1.00	t	2026-08-01 13:55:16.092041+06
e5aa1bb2-7e2d-40bd-8c31-7adda6724ffa	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-01	lunch	1.00	f	2026-08-01 13:55:18.752413+06
62d82eac-4c12-4db4-8734-4b64392b42d8	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-08-01	lunch	1.00	f	2026-08-01 13:55:18.758397+06
64641761-d327-495f-8574-0bcace6721b3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-08-01	lunch	1.00	f	2026-08-01 13:55:18.762253+06
413f3c28-0ac7-49dd-8ede-ccaf8a7431a0	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-01	lunch	1.00	f	2026-08-01 13:55:18.765414+06
ea836863-f494-46b6-aa25-8b558b5438ce	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-01	lunch	1.00	f	2026-08-01 13:55:18.768131+06
e0b06dd1-1dba-4d53-9589-9fec5e294cfe	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-01	lunch	1.00	f	2026-08-01 13:55:18.770029+06
c08cecc8-16ef-4247-9d2a-0ef78070160c	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-03	lunch	1.50	t	2026-08-01 13:55:45.392359+06
3406bc13-e8d8-4875-8078-ad766ae44bc9	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-03	dinner	1.00	t	2026-08-01 13:55:45.395427+06
cdc72636-dc97-4bbd-a09d-769faa49f664	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-08-03	lunch	1.50	t	2026-08-01 13:55:45.398395+06
296cc881-6a2d-4641-a338-e3b96394ed8c	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-08-03	dinner	1.00	t	2026-08-01 13:55:45.40237+06
3c954ec9-9e15-4ab9-9852-c56fe892dc06	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-08-03	lunch	1.50	t	2026-08-01 13:55:45.404351+06
a6084544-59e4-4787-82c9-4d9943ab1568	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-08-03	dinner	1.00	t	2026-08-01 13:55:45.407314+06
62bb4869-d3d7-406d-a23b-2038650e3255	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-03	lunch	1.50	t	2026-08-01 13:55:45.409329+06
2830c5ba-d77d-4315-887a-a63c6509eefd	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-03	dinner	1.00	t	2026-08-01 13:55:45.411236+06
fcbffb8c-a552-4ed8-a12b-a87674fa0540	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-03	lunch	1.50	t	2026-08-01 13:55:45.413421+06
83d394b5-7733-45da-aac2-277710e9a913	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-03	dinner	1.00	t	2026-08-01 13:55:45.415292+06
6ad4a017-9c45-4b8f-ad0d-997927eb340b	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-03	lunch	1.50	t	2026-08-01 13:55:45.417887+06
04844654-0557-4654-878c-456043e2a142	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-03	dinner	1.00	t	2026-08-01 13:55:45.420352+06
d71c2317-c68d-4d00-af51-4a694c52d12b	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-04	lunch	1.50	t	2026-08-01 13:55:51.711342+06
d7b4021e-57ac-4b1c-b45f-b412864f85aa	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-04	dinner	1.00	t	2026-08-01 13:55:51.716542+06
ee2ac1a0-6c1c-4147-b402-dbbbbb438cf1	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-08-04	lunch	1.50	t	2026-08-01 13:55:51.72062+06
adae9fb7-d5da-48c2-8a84-1ec31c523e4b	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-08-04	dinner	1.00	t	2026-08-01 13:55:51.723579+06
12b0783f-3378-43a9-91bb-78502194e235	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-08-04	lunch	1.50	t	2026-08-01 13:55:51.726512+06
755a90dd-66e4-4725-9fb0-efde21777bb5	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-08-04	dinner	1.00	t	2026-08-01 13:55:51.729424+06
db8a26e2-9e2e-4d65-9083-25c07ddd6ee6	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-04	lunch	1.50	t	2026-08-01 13:55:51.735791+06
c1f1e1d3-4372-47c3-b123-8d04e53ac3ea	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-04	dinner	1.00	t	2026-08-01 13:55:51.738442+06
1653c4ef-6824-41cf-bf7c-132f0c0e1a88	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-04	lunch	1.50	t	2026-08-01 13:55:51.740363+06
98ad9687-c802-4707-b14b-46c1b90b2b2a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-04	dinner	1.00	t	2026-08-01 13:55:51.742406+06
f47241e5-54c0-4192-a601-19d335f57672	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-04	lunch	1.50	f	2026-08-01 13:55:54.654645+06
f985902c-5ee4-4fd7-aaf5-328490c071a8	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-04	dinner	1.00	f	2026-08-01 13:55:54.657564+06
d6655173-dc99-4bda-bab7-15713099e268	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-08-04	lunch	1.50	f	2026-08-01 13:55:54.660453+06
4c667bf0-305d-4d77-a799-b0ea29d55269	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-08-04	dinner	1.00	f	2026-08-01 13:55:54.664504+06
3155fa53-0417-4835-a046-570bbdf1e3f0	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-08-04	lunch	1.50	f	2026-08-01 13:55:54.666505+06
4a2b3ac5-799f-46e9-acf0-fef29af01095	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-08-04	dinner	1.00	f	2026-08-01 13:55:54.668555+06
e37ca450-f522-48a1-8529-c92c22536f73	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-04	lunch	1.50	f	2026-08-01 13:55:54.671547+06
a6bad6be-0b58-4b7c-8a92-0eac2c323468	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-04	dinner	1.00	f	2026-08-01 13:55:54.674535+06
80e8342f-8e49-4b78-9f84-92a6cb114ecd	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-04	lunch	1.50	f	2026-08-01 13:55:54.677501+06
4c8ae4a8-8a3f-4954-b793-fb65115df4f2	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-04	dinner	1.00	f	2026-08-01 13:55:54.679695+06
85aebe9b-9f39-4ef5-a919-ee00afc1c363	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-04	lunch	1.50	f	2026-08-01 13:55:54.682421+06
3a4d3a9f-ddb7-4461-94a9-ebf59e8a0e0c	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-04	dinner	1.00	f	2026-08-01 13:55:54.684535+06
fd1bb3ca-8077-432f-9402-09176b8aad4e	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-05	lunch	1.50	f	2026-08-01 13:56:00.230524+06
9d56b8ab-4a9d-4fed-a72f-04e815dce5e2	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-05	dinner	1.00	f	2026-08-01 13:56:00.236704+06
773d64c9-e615-4069-a4fc-a3c787efb7e9	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-08-05	lunch	1.50	f	2026-08-01 13:56:00.240661+06
27e2be7c-542b-4a08-836d-bd2e4214e703	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	2026-08-05	dinner	1.00	f	2026-08-01 13:56:00.243737+06
cff914db-0059-45c1-b4d1-da9246b65fea	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-08-05	lunch	1.50	f	2026-08-01 13:56:00.246703+06
8abca677-487b-486a-9b7e-91f3e3b5909a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	2026-08-05	dinner	1.00	f	2026-08-01 13:56:00.249587+06
3ee97c58-b44d-4db6-8acb-d0eb6837dc82	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-05	lunch	1.50	f	2026-08-01 13:56:00.252594+06
4f3d1809-860f-4923-8d5c-ef1f704312d1	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-05	dinner	1.00	f	2026-08-01 13:56:00.254494+06
d7df4264-7b0d-40d9-9fe4-27a33b755be8	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-05	lunch	1.50	f	2026-08-01 13:56:00.256691+06
54a70490-a8fd-4dbd-bab8-daf168b3bfe3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-05	dinner	1.00	f	2026-08-01 13:56:00.25967+06
449ef6d1-14bf-4ecd-be13-72b61873ee16	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-05	lunch	1.50	f	2026-08-01 13:56:00.262621+06
8c459dd4-3e77-4915-bcb4-24cc9f46128a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-05	dinner	1.00	f	2026-08-01 13:56:00.265637+06
9b3c116f-5a2c-4f61-8505-09b4da33f1d0	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-01	lunch	1.00	f	2026-08-02 01:04:56.645462+06
b2ee0fc1-1be6-4024-99de-f88f8e2a9106	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-01	dinner	1.00	f	2026-08-02 01:04:56.648482+06
d693e3e3-b647-4bfc-88ae-cf640c0fc6a6	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-02	lunch	1.00	f	2026-08-02 16:29:08.168142+06
c77fa817-acff-409a-acaf-174b55ec92f8	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-02	lunch	1.00	f	2026-08-02 16:29:08.176357+06
1464333d-a65e-4978-b7a1-fbeb1c5861b0	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-02	lunch	1.00	f	2026-08-02 16:29:08.180951+06
dc9cc4a8-01c5-4f19-ab8c-c837bb25da0b	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	52f7a42e-b08c-4b69-95eb-bd5a93620795	2026-08-02	lunch	1.00	f	2026-08-02 16:29:08.184713+06
54b3ba67-57c2-48e4-94a3-6bc9a8aa69ec	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-02	lunch	1.00	f	2026-08-02 16:29:08.189894+06
708ae54f-2f8c-4ab4-b329-d6129347915b	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	52f7a42e-b08c-4b69-95eb-bd5a93620795	2026-08-02	lunch	1.00	t	2026-08-02 16:29:28.861633+06
2a3abb1c-1dee-4cbe-829b-4412fb69b799	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-04	lunch	0.50	t	2026-08-04 22:59:16.850838+06
9ce6b2c5-dce8-483a-b65a-29c735f37703	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-04	dinner	1.00	t	2026-08-04 22:59:16.856625+06
45579261-089e-43dc-bd21-d3bed4e0dcc5	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-04	lunch	0.50	f	2026-08-04 22:59:49.604975+06
9e9ad440-c58a-48f6-8a1e-90d2e46c9c77	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-04	dinner	0.50	f	2026-08-04 22:59:55.768975+06
13c39637-aa4c-40f2-8a32-a90050f55ae6	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-04	lunch	0.50	f	2026-08-04 22:59:49.612325+06
d3aa497c-7e5b-4ec7-9f0a-d0482136e270	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-04	dinner	0.50	f	2026-08-04 22:59:55.773525+06
2bca8fb7-5637-4751-8dea-4abf12585aa3	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-04	lunch	0.50	f	2026-08-04 22:59:49.615934+06
8a263780-f4c5-4b78-b8c8-a126abf50e9d	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-04	dinner	0.50	f	2026-08-04 22:59:55.77722+06
d860c662-0bc6-4c93-9c4c-784cff3b62ff	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	52f7a42e-b08c-4b69-95eb-bd5a93620795	2026-08-04	lunch	0.50	f	2026-08-04 22:59:49.617891+06
c6e8fc39-9959-4ff0-8677-0957f4ac117b	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	52f7a42e-b08c-4b69-95eb-bd5a93620795	2026-08-04	dinner	0.50	f	2026-08-04 22:59:55.78167+06
6a6131c2-9db8-43b2-ad85-0772ca95f7b7	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-04	lunch	0.50	f	2026-08-04 22:59:49.62143+06
ec4dfc41-c5aa-4e17-8a2b-0554a6a565b7	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-04	dinner	0.50	f	2026-08-04 22:59:55.785221+06
418d1f1d-1c05-4199-9a2d-143c76372496	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-03	lunch	0.50	f	2026-08-04 23:00:11.255374+06
da642a8e-faee-4717-a4c8-c40c5c5348fb	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-03	lunch	0.50	f	2026-08-04 23:00:11.263295+06
d33244b8-0b2e-4b4c-8531-a64be33861a9	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-03	lunch	0.50	f	2026-08-04 23:00:11.267688+06
1a1ca737-e2d5-4b43-97c0-657d9f37f63d	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	52f7a42e-b08c-4b69-95eb-bd5a93620795	2026-08-03	lunch	0.50	f	2026-08-04 23:00:11.270771+06
ec195f68-49eb-4eed-98df-44ff5ce43a4f	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-03	lunch	0.50	f	2026-08-04 23:00:11.274715+06
f0ef4770-0126-4e3f-8596-6cb407eb3ffc	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-03	dinner	0.50	f	2026-08-04 23:00:18.589075+06
5f57d84f-6695-4951-843f-4298ca06e964	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-08-03	dinner	0.50	f	2026-08-04 23:00:18.594997+06
af11a376-6838-445c-8051-3d3c4f3d0aff	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	2026-08-03	dinner	0.50	f	2026-08-04 23:00:18.598242+06
b84a44b4-5fd2-47de-ad4e-bda9c5633dee	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	52f7a42e-b08c-4b69-95eb-bd5a93620795	2026-08-03	dinner	0.50	f	2026-08-04 23:00:18.601182+06
483aeb01-292e-4971-9984-ee3b4f38bd0d	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	eaa3884b-dba4-4de5-9ade-43eba9860fa9	2026-08-03	dinner	0.50	f	2026-08-04 23:00:18.604076+06
\.


--
-- Data for Name: memberships; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.memberships (id, user_id, mess_id, role, status, joined_at, moderator_from, moderator_until) FROM stdin;
fe463a78-4074-4c9c-94a6-de56e2c392b5	711afac6-6cfe-4064-a61b-b32f1c4563a6	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	member	active	2026-07-31 15:12:35.515012+06	\N	\N
93b38ab6-e47d-4fec-8bb1-d9473559eb20	1bd65e57-8755-4d21-ad14-166ba495eb7a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	manager	active	2026-07-31 16:11:34.574305+06	\N	\N
7fae21c6-f6a1-4748-95dd-074e1e2cc9fa	5b032632-dc3d-4353-acd5-21b75b9650e3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	moderator	left	2026-07-31 16:18:59.512506+06	\N	\N
88dd508f-9ad8-49a8-aa61-3a1fe2ba2cb5	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	member	left	2026-08-01 12:06:49.187617+06	\N	\N
5fe0d84e-803f-4d4f-af61-c85506df11e4	5b032632-dc3d-4353-acd5-21b75b9650e3	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	manager	active	2026-08-01 23:57:26.957995+06	\N	\N
bc9335eb-bbe8-4534-8053-fa6ff8eb47fd	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	member	active	2026-08-01 23:58:35.933764+06	\N	\N
4271783f-0a12-45cd-a7be-ba0f0c277b65	573fad4f-ba7c-411e-86a4-39e03ca01943	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	moderator	active	2026-08-01 23:59:11.794032+06	2026-08-01	2026-08-04
12ef418d-25de-4a10-9b20-e6d21714f3e4	52f7a42e-b08c-4b69-95eb-bd5a93620795	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	member	active	2026-08-02 12:50:02.039652+06	\N	\N
67d2c6be-f1d8-4c54-9739-90ba8a577e9f	eaa3884b-dba4-4de5-9ade-43eba9860fa9	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	member	left	2026-07-31 21:22:05.484344+06	\N	\N
c19bcb08-9444-4863-87df-58599b544792	eaa3884b-dba4-4de5-9ade-43eba9860fa9	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	member	active	2026-08-02 01:03:53.038975+06	\N	\N
7b6d0c21-cbe6-4ccf-9bc5-f71342e434fe	573fad4f-ba7c-411e-86a4-39e03ca01943	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	manager	active	2026-07-31 15:03:52.211855+06	\N	\N
\.


--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.menus (id, mess_id, date, breakfast, lunch, dinner) FROM stdin;
6629809a-a7a7-4771-b703-8fec980e1d1d	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	2026-07-31	Fish curry	Chicken curry with Red spinach
a6b2726b-f1ad-4fbb-b0a4-c77858437b10	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	2026-07-29	Mutton	Hilsha Fish Curry
ff4aa923-7926-4e2f-8428-68cb1b744df9	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	2026-07-28	Fish Curry	Alu Vaji with Potato Smash
7f854d26-4d97-43f0-88ed-b2444af6063b	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	2026-07-27	Egg	Fish
b8ed9d70-705a-4819-a7c6-881ae77da9ff	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	2026-08-01		
12865a5a-66f2-476b-8f05-06e29e33c58f	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	2026-08-03		
2e981634-4ec4-41dc-a054-0e850ccc8dd0	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	2026-08-04		
344fa66d-4a6f-47dc-a9bd-90ec40ace43a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	2026-08-05		
0b18977e-e0a1-4b98-9575-8a58ebf6121a	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	2026-08-01		
529f3527-fc6c-41a4-8d29-aeaabcc82601	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	2026-08-02		
83976d69-1fca-45b5-a40c-15513bbada44	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	2026-08-04		
de0bbf6d-200f-4934-88fd-fcb365f97ebd	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	2026-08-03		
\.


--
-- Data for Name: messes; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.messes (id, name, mess_code, created_by, created_at) FROM stdin;
148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	xyz	RSEQS0	573fad4f-ba7c-411e-86a4-39e03ca01943	2026-07-31 15:03:52.209758+06
a4d863e3-6dbd-468d-bea1-be3b7df5aedd	Libya House 	P84J0A	5b032632-dc3d-4353-acd5-21b75b9650e3	2026-08-01 23:57:26.955139+06
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.notices (id, mess_id, author_id, message, created_at, target_type, target_user_ids, edited_at) FROM stdin;
ec005faf-fedc-4cf6-9b9d-53f47df626ba	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	hkjhkjh	2026-07-31 15:07:50.575855+06	all	\N	\N
4d6763c0-cf42-45be-b6f5-19de2dbf826d	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	goa mara khao sobaii	2026-07-31 15:25:10.348566+06	all	\N	\N
238a1982-13cf-4f8e-9f24-453d57f025e5	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	hello	2026-08-01 17:39:16.358207+06	all	\N	\N
b1795294-4ac3-4ff1-b74c-7eeeed0fe041	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	hi	2026-08-01 17:39:31.585895+06	all	\N	\N
1a73eb2a-2433-4c08-a336-4deb5cbcd186	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	hi hello	2026-08-01 17:49:37.69038+06	all	\N	\N
f6015e29-3bda-4c49-ab5d-aa20eff6c6f0	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	hi hi	2026-08-01 17:51:58.176485+06	all	\N	\N
e5cf2e74-f02a-42b5-ac1a-27b207af20b6	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	hi sabit	2026-08-01 17:56:57.931697+06	individual	{573fad4f-ba7c-411e-86a4-39e03ca01943}	\N
6fc2286c-accf-436f-bafe-a66f9d768862	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	hi guys	2026-08-01 17:57:07.359287+06	group	{573fad4f-ba7c-411e-86a4-39e03ca01943,5b032632-dc3d-4353-acd5-21b75b9650e3}	\N
1bebb66f-f8d3-411c-8c93-cd6b56250774	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	573fad4f-ba7c-411e-86a4-39e03ca01943	Hello guys, welcome to our new Mess Management System. If you find any bug please report to the manager. Ki obosta vai	2026-08-02 00:17:45.451294+06	all	\N	2026-08-03 01:52:32.952465+06
cef8c737-202a-4fd4-8cb7-7c3310447566	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	Good night	2026-08-02 13:52:16.852299+06	group	{5b032632-dc3d-4353-acd5-21b75b9650e3,573fad4f-ba7c-411e-86a4-39e03ca01943}	2026-08-03 02:07:27.617043+06
ca8f072a-5b00-4782-88be-76e71d1deaf7	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	573fad4f-ba7c-411e-86a4-39e03ca01943	Hello guys, this welcome to our new Mess Management system. How is it..?	2026-08-02 00:14:57.308288+06	all	\N	2026-08-03 02:07:28.373849+06
77b80b89-c824-4d1e-a626-82591efc6e3a	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	Test notice, edited, updated	2026-08-03 02:14:09.262038+06	individual	{573fad4f-ba7c-411e-86a4-39e03ca01943}	2026-08-03 02:19:01.048272+06
8bb433e5-4761-4ced-9678-4d7e36e88bf7	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	This is test announcement edited,  updated,  upgraded 3	2026-08-03 02:14:46.221721+06	all	\N	2026-08-03 02:25:10.231297+06
dba3488d-26c2-41d2-8bb4-b7396d7f9781	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	Announcement	2026-08-03 02:46:06.928646+06	all	\N	\N
5883413d-bdf2-471b-99ca-d1ca3e552ab5	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	Group 2	2026-08-03 02:47:47.081997+06	group	{20ab8718-0d96-4d98-97f6-df2d3e7b6e2f,5b032632-dc3d-4353-acd5-21b75b9650e3}	\N
cf501188-1525-4ddb-bd5e-53dbc650bed8	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	Group e	2026-08-03 02:47:05.884827+06	group	{5b032632-dc3d-4353-acd5-21b75b9650e3,573fad4f-ba7c-411e-86a4-39e03ca01943}	2026-08-03 02:48:07.571372+06
db2d40f0-00ea-462c-b342-48f5c0b178d4	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	test group notice	2026-08-04 23:09:59.761472+06	group	{5b032632-dc3d-4353-acd5-21b75b9650e3,573fad4f-ba7c-411e-86a4-39e03ca01943,20ab8718-0d96-4d98-97f6-df2d3e7b6e2f}	\N
03b5c314-2d4b-446a-b292-563570b493ef	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	hello Tamal	2026-08-04 23:10:36.148437+06	individual	{5b032632-dc3d-4353-acd5-21b75b9650e3}	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.notifications (id, user_id, mess_id, type, message, read_at, created_at, edited_at) FROM stdin;
126f1bdb-3050-41c1-9679-6221ca07ecc9	1bd65e57-8755-4d21-ad14-166ba495eb7a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	announcement	hi hello	\N	2026-08-01 17:49:37.701488+06	\N
bbf3bcf4-b38a-4554-bad4-1ed2ab99dbdc	5b032632-dc3d-4353-acd5-21b75b9650e3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	announcement	hi hello	\N	2026-08-01 17:49:37.703606+06	\N
66ee0189-8a0a-4b51-85b7-416579ff884f	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	announcement	hi hello	\N	2026-08-01 17:49:37.707592+06	\N
48d288db-1cb3-4124-a2f8-d1eb1658adc3	5b032632-dc3d-4353-acd5-21b75b9650e3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	personal_notice	hi guys	\N	2026-08-01 17:57:07.367563+06	\N
85afbcf5-12b2-41ea-9d4c-a33ebf049160	5b032632-dc3d-4353-acd5-21b75b9650e3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	Tamal chakroborty has requested to leave the mess.	\N	2026-08-01 23:00:27.682096+06	\N
422a4dae-7fdd-484b-971a-5cfb440f85ed	5b032632-dc3d-4353-acd5-21b75b9650e3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	Your leave request has been approved. You are no longer a member of this mess.	\N	2026-08-01 23:02:16.6699+06	\N
91b78c28-ea12-45aa-b0de-ac542a4fe2b7	1bd65e57-8755-4d21-ad14-166ba495eb7a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	sabit has requested to leave the mess.	\N	2026-08-01 23:53:20.700307+06	\N
3ea6427a-1c1f-4221-bb67-b51af161cee4	5b032632-dc3d-4353-acd5-21b75b9650e3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	sabit has requested to leave the mess.	\N	2026-08-01 23:53:20.702658+06	\N
09ac424e-d6ff-4c59-8ac5-6c8197937b3b	1bd65e57-8755-4d21-ad14-166ba495eb7a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	Tamal chakroborty has requested to leave the mess.	\N	2026-08-01 23:54:19.695935+06	\N
c3760ebf-4572-488e-bbf5-18b9a84d69ee	5b032632-dc3d-4353-acd5-21b75b9650e3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	Tamal chakroborty has requested to leave the mess.	\N	2026-08-01 23:54:19.698433+06	\N
d6319adf-bab9-4b35-bb7d-43a013f9f918	5b032632-dc3d-4353-acd5-21b75b9650e3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	Your leave request has been approved. You are no longer a member of this mess.	\N	2026-08-01 23:54:36.80846+06	\N
5e79f0be-d3e7-46f5-a504-5d17138fc40f	1bd65e57-8755-4d21-ad14-166ba495eb7a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	Shaon Basak  has requested to leave the mess.	\N	2026-08-01 23:55:50.339306+06	\N
54599afd-1c59-4b51-986e-b84dc0f4d271	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	Your leave request has been approved. You are no longer a member of this mess.	\N	2026-08-01 23:56:03.348426+06	\N
a1cd3066-43da-457b-adba-458ba37df41c	573fad4f-ba7c-411e-86a4-39e03ca01943	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	Hello guys, welcome to our new Mess Management System. If you find any bug please report to the manager.	2026-08-02 13:51:02.09071+06	2026-08-02 00:17:45.455665+06	\N
917b231a-f67b-4c3e-a100-4716562899b9	5b032632-dc3d-4353-acd5-21b75b9650e3	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	group_notice	Test	2026-08-02 13:52:31.014245+06	2026-08-02 13:52:16.857299+06	\N
f034ca74-cc74-40a4-9663-d08c7003203f	573fad4f-ba7c-411e-86a4-39e03ca01943	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	group_notice	Test	2026-08-02 14:01:54.340927+06	2026-08-02 13:52:16.859863+06	\N
2207745e-090c-4331-a7e7-1ee8b27fdc4a	eaa3884b-dba4-4de5-9ade-43eba9860fa9	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	announcement	hi hello	2026-08-02 15:17:21.364375+06	2026-08-01 17:49:37.705566+06	\N
69aa5a10-b1bf-42e5-89a6-427547696a94	1bd65e57-8755-4d21-ad14-166ba495eb7a	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	Jeonta Roy Turjo has requested to leave the mess.	\N	2026-08-02 15:17:35.548852+06	\N
6f94bdc0-ad2d-4697-ad13-4f32207e5e25	eaa3884b-dba4-4de5-9ade-43eba9860fa9	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	Your leave request has been approved. You are no longer a member of xyz.	\N	2026-08-02 15:26:01.348+06	\N
17e4ce9e-2389-4a97-aa97-fc10404fb750	eaa3884b-dba4-4de5-9ade-43eba9860fa9	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	leave	Your leave request has been approved. You are no longer a member of Libya House.	2026-08-02 15:27:39.927804+06	2026-08-02 15:26:10.061871+06	\N
772d3348-b7b8-49f8-908a-5ebf9dc5b305	711afac6-6cfe-4064-a61b-b32f1c4563a6	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	announcement	hi hello	2026-08-03 00:49:25.948984+06	2026-08-01 17:49:37.699554+06	\N
f6ce6c50-e1ed-46a6-9f19-199d30e271a5	573fad4f-ba7c-411e-86a4-39e03ca01943	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	announcement	hi hello	2026-08-03 00:53:13.798198+06	2026-08-01 17:49:37.69726+06	\N
f807eae6-b094-4d5f-8398-e7fc7f6e1040	573fad4f-ba7c-411e-86a4-39e03ca01943	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	announcement	hi hi	2026-08-03 00:53:13.798198+06	2026-08-01 17:51:58.182605+06	\N
58151e41-9cf1-4946-8e2d-3f9d888f3470	573fad4f-ba7c-411e-86a4-39e03ca01943	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	personal_notice	hi sabit	2026-08-03 00:53:13.798198+06	2026-08-01 17:56:57.937451+06	\N
ef1ce9ce-64f5-479e-90cf-c187a4498c5e	573fad4f-ba7c-411e-86a4-39e03ca01943	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	personal_notice	hi guys	2026-08-03 00:53:13.798198+06	2026-08-01 17:57:07.364589+06	\N
a612e78b-80d3-4f08-a546-ed6cc0d6ec34	573fad4f-ba7c-411e-86a4-39e03ca01943	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	Tamal chakroborty has requested to leave the mess.	2026-08-03 00:53:13.798198+06	2026-08-01 23:00:27.678037+06	\N
a1f75830-d74a-4f40-bb0f-acabd6f6ca78	573fad4f-ba7c-411e-86a4-39e03ca01943	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	leave	Your leave request has been approved. You are no longer a member of this mess.	2026-08-03 00:53:13.798198+06	2026-08-01 23:54:04.596223+06	\N
b6f943c8-73f8-4014-8699-2370abea80a8	573fad4f-ba7c-411e-86a4-39e03ca01943	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	Hello guys, this welcome to our new Mess Management system. How is it..?	2026-08-02 13:51:02.09071+06	2026-08-02 00:14:57.312876+06	2026-08-03 02:07:28.368629+06
7a268cad-26ef-481d-86f6-9fe292ac43cf	573fad4f-ba7c-411e-86a4-39e03ca01943	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	Announcement	2026-08-03 02:46:19.944332+06	2026-08-03 02:46:06.939731+06	\N
c5fdd7ea-dc66-4d10-b0de-f95a4aff1a52	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	Group e	\N	2026-08-03 02:48:07.561344+06	2026-08-03 02:48:07.561344+06
298baa14-a332-46fa-9dd2-33415457c235	5b032632-dc3d-4353-acd5-21b75b9650e3	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	This is test announcement edited,  updated,  upgraded 3	2026-08-03 02:27:39.216625+06	2026-08-03 02:14:46.224964+06	2026-08-03 02:25:10.225842+06
7223f32f-717f-4290-810a-df00fd4f683f	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	G1+1	\N	2026-08-03 02:42:29.060107+06	2026-08-03 02:42:29.060107+06
5ed3f181-aa9d-4195-ba72-b77456d7e743	52f7a42e-b08c-4b69-95eb-bd5a93620795	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	G1+1	\N	2026-08-03 02:42:29.063366+06	2026-08-03 02:42:29.063366+06
54292e3d-7c41-41b5-8202-e81c0349e487	eaa3884b-dba4-4de5-9ade-43eba9860fa9	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	G1+1	\N	2026-08-03 02:42:29.065898+06	2026-08-03 02:42:29.065898+06
01e6f61a-32b5-45d5-8e51-ce33c9425328	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	Announcement	\N	2026-08-03 02:46:06.936757+06	\N
294593eb-9331-4c81-903f-1450b5398329	52f7a42e-b08c-4b69-95eb-bd5a93620795	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	Announcement	\N	2026-08-03 02:46:06.942759+06	\N
7dc02187-c357-404d-98df-486c716a4ff3	eaa3884b-dba4-4de5-9ade-43eba9860fa9	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	Announcement	\N	2026-08-03 02:46:06.945846+06	\N
59ed5316-0f14-44b7-a2bc-890b924f33cc	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	group_notice	Group 2	\N	2026-08-03 02:47:47.088209+06	\N
dfab1679-bff0-487c-8122-faf5814d8d12	52f7a42e-b08c-4b69-95eb-bd5a93620795	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	Group e	\N	2026-08-03 02:48:07.565883+06	2026-08-03 02:48:07.565883+06
4006cfd5-752f-45c5-a9e1-30efe50a5afc	eaa3884b-dba4-4de5-9ade-43eba9860fa9	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	Group e	\N	2026-08-03 02:48:07.568405+06	2026-08-03 02:48:07.568405+06
aeffdb85-4965-4714-8aa5-1f75c6adc9fe	573fad4f-ba7c-411e-86a4-39e03ca01943	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	group_notice	Group e	2026-08-03 02:48:13.557556+06	2026-08-03 02:47:05.893639+06	2026-08-03 02:48:07.555096+06
e1a1e05a-e407-412c-91ad-978d4e4f08b3	5b032632-dc3d-4353-acd5-21b75b9650e3	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	announcement	Announcement	2026-08-04 00:08:19.37982+06	2026-08-03 02:46:06.934167+06	\N
40e7c4d3-f415-4df6-8cd1-73eb078550af	5b032632-dc3d-4353-acd5-21b75b9650e3	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	group_notice	Group 2	2026-08-04 00:08:19.37982+06	2026-08-03 02:47:47.091552+06	\N
b834b7b1-e02c-4a07-9626-871a531c8328	5b032632-dc3d-4353-acd5-21b75b9650e3	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	group_notice	Group e	2026-08-04 00:08:19.37982+06	2026-08-03 02:47:05.890577+06	2026-08-03 02:48:07.555096+06
0f91ca94-cbc9-4ecb-a90a-208a7df35883	5b032632-dc3d-4353-acd5-21b75b9650e3	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	assigned_bazar	sabit has assigned Tamal chakroborty bazar duty on Thu, Aug 6, 2026.	\N	2026-08-01 16:44:11.874691+06	\N
d49dc5fb-3ed0-46c1-838a-d0a7b1a70aa9	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	assigned_bazar	Tamal chakroborty has assigned Shaon Basak  bazar duty on Sun, 2 Aug 2026.	\N	2026-08-02 16:30:22.671958+06	\N
c79ec83f-c958-4379-b1c3-0e3032beb966	573fad4f-ba7c-411e-86a4-39e03ca01943	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	assigned_bazar	sabit has assigned sabit bazar duty on Sat, 1 Aug 2026.	2026-08-03 00:53:13.798198+06	2026-08-01 17:54:05.391358+06	\N
cb1a9f08-6fe1-492a-b185-0e1636d3b55c	573fad4f-ba7c-411e-86a4-39e03ca01943	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	personal_notice	Test notice, edited, updated	2026-08-03 02:19:27.067909+06	2026-08-03 02:14:09.267401+06	2026-08-03 02:19:01.043666+06
03fb2cf5-cc2a-4d08-bab5-f8b4ef706a66	5b032632-dc3d-4353-acd5-21b75b9650e3	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	guest_meal_accepted	Your guest meal request has been approved.	2026-08-04 23:00:27.637274+06	2026-08-04 22:59:16.857778+06	\N
18afcace-15d4-4834-9aac-ee216eeafa06	573fad4f-ba7c-411e-86a4-39e03ca01943	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	group_notice	test group notice	\N	2026-08-04 23:09:59.765516+06	\N
229e4967-8ab9-48ed-a482-1c73e7eedd63	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	group_notice	test group notice	\N	2026-08-04 23:09:59.766832+06	\N
2897fadd-512b-46b9-b789-5769fc4fd3f8	5b032632-dc3d-4353-acd5-21b75b9650e3	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	group_notice	test group notice	2026-08-04 23:10:02.83132+06	2026-08-04 23:09:59.763092+06	\N
78042c89-7179-4597-952f-31794b4278e8	5b032632-dc3d-4353-acd5-21b75b9650e3	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	personal_notice	hello Tamal	2026-08-04 23:10:40.811326+06	2026-08-04 23:10:36.149953+06	\N
7c2d8118-95ef-4fb7-be69-1c07bd8e883d	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	event	New event: event test on 2026-08-06	\N	2026-08-04 23:11:12.129803+06	\N
ced7f63c-3f8c-48af-8c80-10cc9cf9d1a1	573fad4f-ba7c-411e-86a4-39e03ca01943	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	event	New event: event test on 2026-08-06	\N	2026-08-04 23:11:12.131298+06	\N
ee8fdb7c-0abd-40d6-bbc9-5dfc15d8ff26	52f7a42e-b08c-4b69-95eb-bd5a93620795	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	event	New event: event test on 2026-08-06	\N	2026-08-04 23:11:12.133869+06	\N
cd7fccbb-0475-40fc-a951-171fde5d9722	eaa3884b-dba4-4de5-9ade-43eba9860fa9	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	event	New event: event test on 2026-08-06	\N	2026-08-04 23:11:12.135403+06	\N
132de085-a8b5-4fdd-bc0f-842aa134bf9f	5b032632-dc3d-4353-acd5-21b75b9650e3	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	event	New event: event test on 2026-08-06	2026-08-04 23:11:17.306753+06	2026-08-04 23:11:12.120821+06	\N
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.profiles (id, name, phone, avatar_url, created_at) FROM stdin;
711afac6-6cfe-4064-a61b-b32f1c4563a6	abc	1111	\N	2026-07-31 15:11:15.310029+06
1bd65e57-8755-4d21-ad14-166ba495eb7a	hh	33	\N	2026-07-31 16:06:07.438813+06
5b032632-dc3d-4353-acd5-21b75b9650e3	Tamal chakroborty	01774567162	/uploads/avatars/5b032632-dc3d-4353-acd5-21b75b9650e3-1785493227726.png	2026-07-31 16:17:55.700068+06
abdd9329-cabf-4d0f-a8e4-121b2876db36	Abcxyz	54321	\N	2026-08-01 15:49:58.021172+06
573fad4f-ba7c-411e-86a4-39e03ca01943	sabit	123	/uploads/avatars/573fad4f-ba7c-411e-86a4-39e03ca01943-1785607305129.jpg	2026-07-31 15:03:29.54857+06
20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	Shaon Basak 	01796751108	/uploads/avatars/20ab8718-0d96-4d98-97f6-df2d3e7b6e2f-1785607381468.jpg	2026-08-01 12:05:45.976349+06
52f7a42e-b08c-4b69-95eb-bd5a93620795	Md Rafi ul islam	01761675624	/uploads/avatars/52f7a42e-b08c-4b69-95eb-bd5a93620795-1785653598349.jpg	2026-08-02 12:49:24.746211+06
eaa3884b-dba4-4de5-9ade-43eba9860fa9	Jeonta Roy Turjo	01324145141	\N	2026-07-31 21:21:12.086592+06
\.


--
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.requests (id, mess_id, user_id, type, status, details, created_at, updated_at) FROM stdin;
9ffeb9b8-35c9-41ad-b152-809f8ad51299	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	711afac6-6cfe-4064-a61b-b32f1c4563a6	join	approved	\N	2026-07-31 15:12:06.014855+06	2026-07-31 15:12:35.515012+06
5a631e1d-1d87-40e7-acfb-a741ac50b7c7	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	join	approved	\N	2026-07-31 16:11:17.142056+06	2026-07-31 16:11:34.574305+06
0c889118-30fb-4137-8c8c-0e7a3a535a63	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	join	approved	\N	2026-07-31 16:18:47.033656+06	2026-07-31 16:18:59.512506+06
7481808b-ef41-4559-af44-223cebfc85ca	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	1bd65e57-8755-4d21-ad14-166ba495eb7a	guest_meal	approved	{"date": "2026-07-31", "guests": [{"name": "saikat", "lunch": 1, "dinner": 1, "shared_with": []}, {"name": "Rupok", "lunch": 1, "dinner": 1, "shared_with": []}]}	2026-07-31 16:57:47.801131+06	2026-07-31 16:59:09.081035+06
5472d5c7-4e2b-4034-ab83-06fdfe37da32	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	guest_meal	approved	{"date": "2026-07-31", "slot": "dinner", "quantity": 0.75, "guest_name": "Hhj"}	2026-07-31 16:46:15.99488+06	2026-07-31 16:59:10.168864+06
cba2a620-1fb1-445b-82f2-bb29dc5f0f6d	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	guest_meal	approved	{"date": "2026-07-31", "guests": [{"name": "Saikot", "lunch": 1, "dinner": 0.5, "shared_with": []}]}	2026-07-31 19:07:20.601569+06	2026-07-31 19:07:39.853882+06
323b80bc-acd7-4c2c-a2df-d6ac6f63c380	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	guest_meal	approved	{"date": "2026-08-04", "guests": [{"name": "Ruyaem", "lunch": 0.5, "dinner": 1, "shared_with": []}]}	2026-07-31 19:14:55.960302+06	2026-07-31 19:15:25.718851+06
9d1d4b50-9e3f-412b-aded-fbba89c0b4fb	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	join	approved	\N	2026-07-31 21:21:52.417698+06	2026-07-31 21:22:05.484344+06
f17f48f4-4b45-43cf-a2a0-3fcc45612cc0	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	meal_off	approved	{"date": "2026-07-31", "lunch": "curry_only", "dinner": "on"}	2026-07-31 23:51:19.31282+06	2026-08-01 00:19:52.481355+06
3f2fe830-1597-4f93-9f95-96fb2296df85	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	meal_off	pending	{"date": "2026-08-01", "lunch": "curry_only", "dinner": "curry_only"}	2026-08-01 00:51:25.740189+06	2026-08-01 00:51:25.740189+06
f43612c5-c287-4f59-93d1-b192ef22bf6b	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	join	approved	\N	2026-08-01 12:06:16.306503+06	2026-08-01 12:06:49.187617+06
42aa97fe-6e54-4cdc-a7fe-0931ba30be4b	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	guest_meal	pending	{"date": "2026-08-01", "guests": [{"name": "Ridoy", "lunch": 1, "dinner": 0.5, "lunch_type": "full", "dinner_type": "curry_only", "shared_with": []}]}	2026-08-01 22:37:48.118647+06	2026-08-01 22:37:48.118647+06
22f20d0e-0c72-4d0a-b05c-2cfd741ab3d1	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	leave	approved	{"balance": 22000}	2026-08-01 23:00:27.673099+06	2026-08-01 23:02:16.6699+06
bb137118-5d3c-42c0-bee1-544a73eb9171	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	join	approved	\N	2026-08-01 23:38:10.439963+06	2026-08-01 23:38:55.528906+06
cc2236a0-b6b9-4594-a32e-653c0211ae1d	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	573fad4f-ba7c-411e-86a4-39e03ca01943	leave	approved	{"balance": 0}	2026-08-01 23:53:20.694611+06	2026-08-01 23:54:04.596223+06
bc933f90-bcb3-4040-bf81-c61a497d9ede	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	5b032632-dc3d-4353-acd5-21b75b9650e3	leave	approved	{"balance": 22000}	2026-08-01 23:54:19.689667+06	2026-08-01 23:54:36.80846+06
bcbe02f3-6964-4b79-8e78-6ca276423634	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	leave	approved	{"balance": 2000}	2026-08-01 23:55:50.334719+06	2026-08-01 23:56:03.348426+06
e0118c84-fbb6-4007-bd20-d6a2a514704f	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	join	approved	\N	2026-08-01 23:58:20.993669+06	2026-08-01 23:58:35.933764+06
89150f59-4d21-4083-bee1-cf32e7e97313	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	573fad4f-ba7c-411e-86a4-39e03ca01943	join	approved	\N	2026-08-01 23:59:03.197978+06	2026-08-01 23:59:11.794032+06
10aae735-6438-44d4-9395-0c0e51c34288	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	eaa3884b-dba4-4de5-9ade-43eba9860fa9	join	approved	\N	2026-08-02 00:50:08.122034+06	2026-08-02 01:03:53.038975+06
677ae06b-c976-4f30-98b0-5367a8472d69	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	52f7a42e-b08c-4b69-95eb-bd5a93620795	join	approved	\N	2026-08-02 12:49:55.904774+06	2026-08-02 12:50:02.039652+06
456d7f73-fb3d-4cfb-bec2-f3d4e62802b0	148f9ea9-a527-44a3-9835-9a6ac0f3d6fa	eaa3884b-dba4-4de5-9ade-43eba9860fa9	leave	approved	{"balance": 20000}	2026-08-02 15:17:35.542896+06	2026-08-02 15:26:01.348+06
3acd9e84-dd90-41eb-9ff7-61a87fd4b127	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	eaa3884b-dba4-4de5-9ade-43eba9860fa9	leave	approved	{"balance": 0}	2026-08-02 15:26:10.061871+06	2026-08-02 15:26:10.061871+06
0abb3e4e-c4b7-46e4-9c2b-69a2ebb621df	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	eaa3884b-dba4-4de5-9ade-43eba9860fa9	join	approved	\N	2026-08-02 15:27:15.493155+06	2026-08-02 15:27:20.577817+06
a4dd1e08-58c6-416e-ad78-541688e43573	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	573fad4f-ba7c-411e-86a4-39e03ca01943	guest_meal	rejected	{"date": "2026-08-02", "guests": [{"name": "dsfd", "lunch": 0.5, "dinner": 0.5, "lunch_type": "rice_only", "dinner_type": "rice_only", "shared_with": []}]}	2026-08-02 15:20:29.645274+06	2026-08-03 01:43:11.208092+06
bfad5366-97fd-4137-aa64-2c6aa1bd02d0	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	guest_meal	rejected	{"date": "2026-08-02", "guests": [{"name": "A", "lunch": 0.5, "dinner": 0.5, "lunch_type": "rice_only", "dinner_type": "curry_only", "shared_with": []}]}	2026-08-02 12:55:26.929597+06	2026-08-03 01:43:13.315282+06
db17be95-f753-42d3-93dd-f2153a4cb5f6	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	meal_off	rejected	{"date": "2026-08-28", "lunch": "off", "dinner": "off"}	2026-08-02 15:13:59.774789+06	2026-08-03 01:43:19.162614+06
05a54883-0cf8-4405-9cf5-988a3368016b	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	meal_off	rejected	{"date": "2026-08-07", "lunch": "rice_only", "dinner": "rice_only"}	2026-08-02 15:10:03.212097+06	2026-08-03 01:43:21.090317+06
86d90e02-f8a4-42ac-b2de-9fd4c1528681	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	573fad4f-ba7c-411e-86a4-39e03ca01943	meal_off	rejected	{"date": "2026-08-03", "lunch": "rice_only", "dinner": "curry_only"}	2026-08-02 14:58:10.088784+06	2026-08-03 01:43:23.155192+06
b35ced5d-dccc-45ab-8295-f0903c97a1b0	a4d863e3-6dbd-468d-bea1-be3b7df5aedd	5b032632-dc3d-4353-acd5-21b75b9650e3	guest_meal	approved	{"date": "2026-08-04", "guests": [{"name": "Taming", "lunch": 0.5, "dinner": 1, "lunch_type": "rice_only", "dinner_type": "full", "shared_with": []}]}	2026-08-03 01:50:49.44347+06	2026-08-04 22:59:16.847563+06
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: mmsuser
--

COPY public.users (id, email, password_hash, name, phone, avatar_url, created_at) FROM stdin;
711afac6-6cfe-4064-a61b-b32f1c4563a6	abc@gmail.com	$2b$10$yTu/OlOAsFXtXIZfICCuN.o18LDHx5JAiK2DXvt770KKzFxGvZz6y	abc	1111	\N	2026-07-31 15:11:15.305185+06
1bd65e57-8755-4d21-ad14-166ba495eb7a	hh@gmail.com	$2b$10$yTu/OlOAsFXtXIZfICCuN.o18LDHx5JAiK2DXvt770KKzFxGvZz6y	hh	33	\N	2026-07-31 16:06:07.434627+06
5b032632-dc3d-4353-acd5-21b75b9650e3	tamalchakrovorty82625@gmail.com	$2b$10$yTu/OlOAsFXtXIZfICCuN.o18LDHx5JAiK2DXvt770KKzFxGvZz6y	Tamal chakroborty	01774567162	/uploads/avatars/5b032632-dc3d-4353-acd5-21b75b9650e3-1785493227726.png	2026-07-31 16:17:55.69592+06
abdd9329-cabf-4d0f-a8e4-121b2876db36	zxy@gmail.com	$2b$10$yTu/OlOAsFXtXIZfICCuN.o18LDHx5JAiK2DXvt770KKzFxGvZz6y	Abcxyz	54321	\N	2026-08-01 15:49:58.016039+06
573fad4f-ba7c-411e-86a4-39e03ca01943	sabit@gmail.com	$2b$10$yTu/OlOAsFXtXIZfICCuN.o18LDHx5JAiK2DXvt770KKzFxGvZz6y	sabit	123	/uploads/avatars/573fad4f-ba7c-411e-86a4-39e03ca01943-1785607305129.jpg	2026-07-31 15:03:29.541014+06
20ab8718-0d96-4d98-97f6-df2d3e7b6e2f	shaonbasaksb@gmail.com	$2b$10$yTu/OlOAsFXtXIZfICCuN.o18LDHx5JAiK2DXvt770KKzFxGvZz6y	Shaon Basak 	01796751108	/uploads/avatars/20ab8718-0d96-4d98-97f6-df2d3e7b6e2f-1785607381468.jpg	2026-08-01 12:05:45.971513+06
52f7a42e-b08c-4b69-95eb-bd5a93620795	rafi.islam@gmail.com	$2b$10$yTu/OlOAsFXtXIZfICCuN.o18LDHx5JAiK2DXvt770KKzFxGvZz6y	Md Rafi ul islam	01761675624	/uploads/avatars/52f7a42e-b08c-4b69-95eb-bd5a93620795-1785653598349.jpg	2026-08-02 12:49:24.743075+06
eaa3884b-dba4-4de5-9ade-43eba9860fa9	jrturjo.41@gmail.com	$2b$10$yTu/OlOAsFXtXIZfICCuN.o18LDHx5JAiK2DXvt770KKzFxGvZz6y	Jeonta Roy Turjo	01324145141	\N	2026-07-31 21:21:12.081593+06
\.


--
-- Name: bazar_duties bazar_duties_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.bazar_duties
    ADD CONSTRAINT bazar_duties_pkey PRIMARY KEY (id);


--
-- Name: bazar_expenses bazar_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.bazar_expenses
    ADD CONSTRAINT bazar_expenses_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: deposits deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: freezer_stock freezer_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.freezer_stock
    ADD CONSTRAINT freezer_stock_pkey PRIMARY KEY (id);


--
-- Name: meal_entries meal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.meal_entries
    ADD CONSTRAINT meal_entries_pkey PRIMARY KEY (id);


--
-- Name: meal_entries meal_entries_unique_per_day; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.meal_entries
    ADD CONSTRAINT meal_entries_unique_per_day UNIQUE (mess_id, user_id, date, slot, is_guest);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_user_id_mess_id_key; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_user_id_mess_id_key UNIQUE (user_id, mess_id);


--
-- Name: menus menus_mess_id_date_key; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_mess_id_date_key UNIQUE (mess_id, date);


--
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_pkey PRIMARY KEY (id);


--
-- Name: messes messes_mess_code_key; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.messes
    ADD CONSTRAINT messes_mess_code_key UNIQUE (mess_code);


--
-- Name: messes messes_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.messes
    ADD CONSTRAINT messes_pkey PRIMARY KEY (id);


--
-- Name: notices notices_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_bazar_expenses_mess_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_bazar_expenses_mess_id ON public.bazar_expenses USING btree (mess_id);


--
-- Name: idx_contacts_mess_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_contacts_mess_id ON public.contacts USING btree (mess_id);


--
-- Name: idx_deposits_mess_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_deposits_mess_id ON public.deposits USING btree (mess_id);


--
-- Name: idx_deposits_mess_user; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_deposits_mess_user ON public.deposits USING btree (mess_id, user_id);


--
-- Name: idx_deposits_user_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_deposits_user_id ON public.deposits USING btree (user_id);


--
-- Name: idx_freezer_stock_mess_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_freezer_stock_mess_id ON public.freezer_stock USING btree (mess_id);


--
-- Name: idx_meal_entries_date; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_meal_entries_date ON public.meal_entries USING btree (date);


--
-- Name: idx_meal_entries_is_guest; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_meal_entries_is_guest ON public.meal_entries USING btree (is_guest);


--
-- Name: idx_meal_entries_mess_date; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_meal_entries_mess_date ON public.meal_entries USING btree (mess_id, date);


--
-- Name: idx_meal_entries_mess_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_meal_entries_mess_id ON public.meal_entries USING btree (mess_id);


--
-- Name: idx_meal_entries_user_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_meal_entries_user_id ON public.meal_entries USING btree (user_id);


--
-- Name: idx_memberships_mess_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_memberships_mess_id ON public.memberships USING btree (mess_id);


--
-- Name: idx_memberships_status; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_memberships_status ON public.memberships USING btree (status);


--
-- Name: idx_memberships_user_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_memberships_user_id ON public.memberships USING btree (user_id);


--
-- Name: idx_memberships_user_mess_status; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_memberships_user_mess_status ON public.memberships USING btree (user_id, mess_id, status);


--
-- Name: idx_menus_mess_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_menus_mess_id ON public.menus USING btree (mess_id);


--
-- Name: idx_messes_mess_code; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_messes_mess_code ON public.messes USING btree (mess_code);


--
-- Name: idx_notices_mess_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_notices_mess_id ON public.notices USING btree (mess_id);


--
-- Name: idx_notifications_mess_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_notifications_mess_id ON public.notifications USING btree (mess_id);


--
-- Name: idx_requests_mess_id; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_requests_mess_id ON public.requests USING btree (mess_id);


--
-- Name: idx_requests_mess_type_status; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_requests_mess_type_status ON public.requests USING btree (mess_id, type, status);


--
-- Name: idx_requests_type; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_requests_type ON public.requests USING btree (type);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: mmsuser
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: bazar_duties bazar_duties_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.bazar_duties
    ADD CONSTRAINT bazar_duties_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: bazar_duties bazar_duties_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.bazar_duties
    ADD CONSTRAINT bazar_duties_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bazar_expenses bazar_expenses_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.bazar_expenses
    ADD CONSTRAINT bazar_expenses_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: bazar_expenses bazar_expenses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.bazar_expenses
    ADD CONSTRAINT bazar_expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: contacts contacts_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: deposits deposits_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: deposits deposits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: events events_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: events events_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: freezer_stock freezer_stock_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.freezer_stock
    ADD CONSTRAINT freezer_stock_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: meal_entries meal_entries_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.meal_entries
    ADD CONSTRAINT meal_entries_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: meal_entries meal_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.meal_entries
    ADD CONSTRAINT meal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: memberships memberships_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: memberships memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: menus menus_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: messes messes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.messes
    ADD CONSTRAINT messes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: notices notices_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: notices notices_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: requests requests_mess_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;


--
-- Name: requests requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmsuser
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict BHdblyNngfVKoeJAUxpYlrS3hCy6l15TUmIDwqy31NfZ0HGdMx5YYWxjbbDkLiC


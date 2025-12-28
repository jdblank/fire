--
-- PostgreSQL database dump
--

\restrict i4LWwDLA9DFKft47C1DjzjxWDBCYzIgc6JvuFYi5ZCg13NwdRWRSddcJNF8v6Ym

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AccountStatus; Type: TYPE; Schema: public; Owner: fireuser
--

CREATE TYPE public."AccountStatus" AS ENUM (
    'PENDING_INVITE',
    'ACTIVE',
    'SUSPENDED',
    'DEACTIVATED'
);


ALTER TYPE public."AccountStatus" OWNER TO fireuser;

--
-- Name: CalculationMethod; Type: TYPE; Schema: public; Owner: fireuser
--

CREATE TYPE public."CalculationMethod" AS ENUM (
    'FIXED_AMOUNT',
    'AGE_MULTIPLIER',
    'PERCENTAGE'
);


ALTER TYPE public."CalculationMethod" OWNER TO fireuser;

--
-- Name: DiscountType; Type: TYPE; Schema: public; Owner: fireuser
--

CREATE TYPE public."DiscountType" AS ENUM (
    'FIXED_AMOUNT',
    'PERCENTAGE'
);


ALTER TYPE public."DiscountType" OWNER TO fireuser;

--
-- Name: EventStatus; Type: TYPE; Schema: public; Owner: fireuser
--

CREATE TYPE public."EventStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public."EventStatus" OWNER TO fireuser;

--
-- Name: EventType; Type: TYPE; Schema: public; Owner: fireuser
--

CREATE TYPE public."EventType" AS ENUM (
    'FREE',
    'PAID'
);


ALTER TYPE public."EventType" OWNER TO fireuser;

--
-- Name: LineItemType; Type: TYPE; Schema: public; Owner: fireuser
--

CREATE TYPE public."LineItemType" AS ENUM (
    'AGE_BASED',
    'FIXED',
    'OPTIONAL_FIXED',
    'OPTIONAL_VARIABLE'
);


ALTER TYPE public."LineItemType" OWNER TO fireuser;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: fireuser
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO fireuser;

--
-- Name: RegistrationPaymentStatus; Type: TYPE; Schema: public; Owner: fireuser
--

CREATE TYPE public."RegistrationPaymentStatus" AS ENUM (
    'UNPAID',
    'DEPOSIT_PAID',
    'FULLY_PAID',
    'REFUNDED'
);


ALTER TYPE public."RegistrationPaymentStatus" OWNER TO fireuser;

--
-- Name: RegistrationStatus; Type: TYPE; Schema: public; Owner: fireuser
--

CREATE TYPE public."RegistrationStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'WAITLIST'
);


ALTER TYPE public."RegistrationStatus" OWNER TO fireuser;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: fireuser
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'MODERATOR',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO fireuser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO fireuser;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.comments (
    id text NOT NULL,
    "postId" text NOT NULL,
    "authorId" text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.comments OWNER TO fireuser;

--
-- Name: discounts; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.discounts (
    id text NOT NULL,
    "registrationId" text NOT NULL,
    name text NOT NULL,
    "discountType" public."DiscountType" NOT NULL,
    amount numeric(10,2) NOT NULL,
    "appliedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.discounts OWNER TO fireuser;

--
-- Name: event_line_items; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.event_line_items (
    id text NOT NULL,
    "eventId" text NOT NULL,
    name text NOT NULL,
    description text,
    "lineItemType" public."LineItemType" NOT NULL,
    "isRequired" boolean DEFAULT false NOT NULL,
    "calculationMethod" public."CalculationMethod" NOT NULL,
    "baseAmount" numeric(10,2),
    "minAmount" numeric(10,2),
    "maxAmount" numeric(10,2),
    multiplier numeric(10,2),
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.event_line_items OWNER TO fireuser;

--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.event_registrations (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "userId" text NOT NULL,
    status public."RegistrationStatus" DEFAULT 'PENDING'::public."RegistrationStatus" NOT NULL,
    "totalAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "depositPaid" numeric(10,2) DEFAULT 0 NOT NULL,
    "balanceDue" numeric(10,2) DEFAULT 0 NOT NULL,
    "paymentStatus" public."RegistrationPaymentStatus" DEFAULT 'UNPAID'::public."RegistrationPaymentStatus" NOT NULL,
    "adminOverride" boolean DEFAULT false NOT NULL,
    "overrideNote" text,
    "registeredById" text,
    "paymentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.event_registrations OWNER TO fireuser;

--
-- Name: events; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.events (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    banner text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    timezone text,
    location text,
    "isOnline" boolean DEFAULT false NOT NULL,
    "eventType" public."EventType" DEFAULT 'FREE'::public."EventType" NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "requiresDeposit" boolean DEFAULT false NOT NULL,
    "depositAmount" numeric(10,2),
    "maxAttendees" integer,
    status public."EventStatus" DEFAULT 'DRAFT'::public."EventStatus" NOT NULL,
    "createdById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.events OWNER TO fireuser;

--
-- Name: invite_tokens; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.invite_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.invite_tokens OWNER TO fireuser;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "userId" text NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    provider text NOT NULL,
    "providerId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO fireuser;

--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.post_likes (
    id text NOT NULL,
    "postId" text NOT NULL,
    "userId" text NOT NULL,
    "isLike" boolean NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.post_likes OWNER TO fireuser;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.posts (
    id text NOT NULL,
    "authorId" text NOT NULL,
    content text NOT NULL,
    images text[],
    videos text[],
    "linkUrl" text,
    "linkTitle" text,
    "linkDescription" text,
    "linkImage" text,
    likes integer DEFAULT 0 NOT NULL,
    dislikes integer DEFAULT 0 NOT NULL,
    "isPinned" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.posts OWNER TO fireuser;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    bio text,
    location text,
    website text,
    avatar text,
    banner text,
    twitter text,
    github text,
    linkedin text,
    "isPublic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.profiles OWNER TO fireuser;

--
-- Name: registration_line_items; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.registration_line_items (
    id text NOT NULL,
    "registrationId" text NOT NULL,
    "lineItemId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "calculatedAmount" numeric(10,2) NOT NULL,
    "userAge" integer,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.registration_line_items OWNER TO fireuser;

--
-- Name: uploads; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.uploads (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    url text NOT NULL,
    bucket text NOT NULL,
    key text NOT NULL,
    "uploadedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.uploads OWNER TO fireuser;

--
-- Name: users; Type: TABLE; Schema: public; Owner: fireuser
--

CREATE TABLE public.users (
    id text NOT NULL,
    "logtoId" text,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    "firstName" text,
    "lastName" text,
    "displayName" text,
    username text,
    image text,
    "dateOfBirth" timestamp(3) without time zone,
    "mobilePhone" text,
    "countryCode" text,
    hometown text,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "accountStatus" public."AccountStatus" DEFAULT 'PENDING_INVITE'::public."AccountStatus" NOT NULL,
    "referredById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLoginAt" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO fireuser;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6ce3788f-76cd-488c-b9db-2eecd93c6e58	029b11694118ac58dbff1299fb53844f51c97f4e646d329c10346bb3ba4e2711	2025-12-26 03:47:04.475575+00	20251226034704_init	\N	\N	2025-12-26 03:47:04.370258+00	1
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.comments (id, "postId", "authorId", content, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: discounts; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.discounts (id, "registrationId", name, "discountType", amount, "appliedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: event_line_items; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.event_line_items (id, "eventId", name, description, "lineItemType", "isRequired", "calculationMethod", "baseAmount", "minAmount", "maxAmount", multiplier, "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmjq8g8r600015qqtbf99mifq	cmjp1z1d70005t3li1mbkpr71	Annual Dues	Age-based camp dues	AGE_BASED	t	AGE_MULTIPLIER	\N	1800.00	3600.00	60.00	1	2025-12-28 21:19:49.841	2025-12-28 21:19:49.841
cmjq8gwi100035qqtuqm64pjd	cmjp1z1d70005t3li1mbkpr71	RV Supplement	\N	OPTIONAL_FIXED	f	FIXED_AMOUNT	500.00	\N	\N	\N	2	2025-12-28 21:20:20.618	2025-12-28 21:20:20.618
cmjq8h9nb00055qqt543wf057	cmjp1z1d70005t3li1mbkpr71	Bike Deposit	\N	OPTIONAL_FIXED	f	FIXED_AMOUNT	250.00	\N	\N	\N	3	2025-12-28 21:20:37.656	2025-12-28 21:20:37.656
\.


--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.event_registrations (id, "eventId", "userId", status, "totalAmount", "depositPaid", "balanceDue", "paymentStatus", "adminOverride", "overrideNote", "registeredById", "paymentId", "createdAt", "updatedAt") FROM stdin;
cmjn8uyij00074foewpkwm5im	cmjn8uifo00054foe4j50mmhd	cmjn7yq7600034foe5zy7jz0j	CONFIRMED	0.00	0.00	0.00	UNPAID	t	Registered by admin	28m5yx1bfe3b	\N	2025-12-26 19:07:57.883	2025-12-26 19:07:57.883
cmjn8va0f00094foetdilcq39	cmjn8uifo00054foe4j50mmhd	cmjn7xvnj00014foek5w8iwvd	CONFIRMED	0.00	0.00	0.00	UNPAID	t	Registered by admin	28m5yx1bfe3b	\N	2025-12-26 19:08:12.784	2025-12-26 19:08:12.784
cmjn8vko9000b4foehuejq8af	cmjn8uifo00054foe4j50mmhd	28m5yx1bfe3b	CONFIRMED	0.00	0.00	0.00	UNPAID	t	Registered by admin	28m5yx1bfe3b	\N	2025-12-26 19:08:26.602	2025-12-26 19:08:26.602
cmjq8luh900075qqtks9pidvx	cmjp1z1d70005t3li1mbkpr71	28m5yx1bfe3b	PENDING	3810.00	0.00	3810.00	UNPAID	f	\N	28m5yx1bfe3b	\N	2025-12-28 21:24:11.275	2025-12-28 21:24:11.275
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.events (id, title, description, banner, "startDate", "endDate", timezone, location, "isOnline", "eventType", currency, "requiresDeposit", "depositAmount", "maxAttendees", status, "createdById", "createdAt", "updatedAt") FROM stdin;
cmjn8uifo00054foe4j50mmhd	Burning Man 2025		\N	2025-08-24 00:00:00	2025-09-01 23:59:00	America/New_York	\N	f	PAID	USD	f	\N	\N	PUBLISHED	28m5yx1bfe3b	2025-12-26 19:07:37.043	2025-12-26 19:07:37.043
cmjp1z1d70005t3li1mbkpr71	Burning Man 2026		\N	2026-08-30 00:00:00	2026-09-07 23:59:00	America/Los_Angeles	Black Rock City, NV	f	PAID	USD	t	250.00	100	PUBLISHED	28m5yx1bfe3b	2025-12-28 01:30:43.242	2025-12-28 21:20:42.818
\.


--
-- Data for Name: invite_tokens; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.invite_tokens (id, token, "userId", "expiresAt", "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.payments (id, "userId", amount, currency, status, provider, "providerId", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.post_likes (id, "postId", "userId", "isLike", "createdAt") FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.posts (id, "authorId", content, images, videos, "linkUrl", "linkTitle", "linkDescription", "linkImage", likes, dislikes, "isPinned", "createdAt", "updatedAt") FROM stdin;
cmjn97fgl000d4foepnd6h09n	28m5yx1bfe3b	Waiting patiently for the MOOP Map:\n\nhttps://burningman.org/about/history/brc-history/moop-maps/	{}	{}	https://burningman.org/about/history/brc-history/moop-maps/	MOOP Map Archive	Burning Man is the largest Leave No Trace event in the world, and Black Rock City continues to be recognized by the Bureau of Land Management for not only maintaining Leave No Trace standards, but for setting high standards by...	https://burningman.org/wp-content/uploads/Header_Whatis.jpeg	0	0	f	2025-12-26 19:17:39.717	2025-12-26 19:17:39.717
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.profiles (id, "userId", bio, location, website, avatar, banner, twitter, github, linkedin, "isPublic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: registration_line_items; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.registration_line_items (id, "registrationId", "lineItemId", quantity, "calculatedAmount", "userAge", notes, "createdAt") FROM stdin;
cmjq8luh900095qqts4xw1eku	cmjq8luh900075qqtks9pidvx	cmjq8g8r600015qqtbf99mifq	1	3060.00	51	\N	2025-12-28 21:24:11.275
cmjq8luh9000a5qqtpf7nl45a	cmjq8luh900075qqtks9pidvx	cmjq8gwi100035qqtuqm64pjd	1	500.00	\N	\N	2025-12-28 21:24:11.275
cmjq8luh9000b5qqtmup1ahjn	cmjq8luh900075qqtks9pidvx	cmjq8h9nb00055qqt543wf057	1	250.00	\N	\N	2025-12-28 21:24:11.275
\.


--
-- Data for Name: uploads; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.uploads (id, filename, "originalName", "mimeType", size, url, bucket, key, "uploadedBy", "createdAt") FROM stdin;
cmjq8zxg5000c5qqt4czhgjr0	avatars/1766957708259-rbsoe7.jpg	josh.jpg	image/jpeg	30318	http://localhost:9100/fire-uploads/avatars/1766957708259-rbsoe7.jpg	fire-uploads	avatars/1766957708259-rbsoe7.jpg	28m5yx1bfe3b	2025-12-28 21:35:08.309
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: fireuser
--

COPY public.users (id, "logtoId", email, "emailVerified", "firstName", "lastName", "displayName", username, image, "dateOfBirth", "mobilePhone", "countryCode", hometown, role, "accountStatus", "referredById", "createdAt", "updatedAt", "lastLoginAt") FROM stdin;
cmjn7xvnj00014foek5w8iwvd	\N	dss682@gmail.com	\N	Don	Spear	Don	\N	\N	\N	\N	+1		USER	PENDING_INVITE	\N	2025-12-26 18:42:14.528	2025-12-26 18:42:14.528	\N
cmjn7yq7600034foe5zy7jz0j	\N	mariaelena@theblanks.net	\N	Maria Elena	Romero de Blank	Maria Elena	\N	\N	1972-10-31 00:00:00	\N	+1		USER	PENDING_INVITE	28m5yx1bfe3b	2025-12-26 18:42:54.115	2025-12-26 19:04:32.719	\N
cmjp21dct0007t3liqd2e074b	\N	blspear@gmail.com	\N	Brenner	Spear	Brenner	\N	\N	\N	\N	+1	Brooklyn, NY	USER	PENDING_INVITE	cmjn7xvnj00014foek5w8iwvd	2025-12-28 01:32:32.091	2025-12-28 01:32:32.091	\N
28m5yx1bfe3b	6b8dc58d-c8be-488c-a3b8-c9fe2c564a4e	josh@lemonade.art	\N	josh	josh	josh	josh	http://localhost:9100/fire-uploads/avatars/1766957708259-rbsoe7.jpg	1975-03-03 00:00:00		\N	Austin, TX	ADMIN	ACTIVE	\N	2025-12-26 05:09:36.051	2025-12-28 21:35:08.323	2025-12-28 01:27:57.145
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: discounts discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_pkey PRIMARY KEY (id);


--
-- Name: event_line_items event_line_items_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.event_line_items
    ADD CONSTRAINT event_line_items_pkey PRIMARY KEY (id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: invite_tokens invite_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.invite_tokens
    ADD CONSTRAINT invite_tokens_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: registration_line_items registration_line_items_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.registration_line_items
    ADD CONSTRAINT registration_line_items_pkey PRIMARY KEY (id);


--
-- Name: uploads uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: comments_authorId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "comments_authorId_idx" ON public.comments USING btree ("authorId");


--
-- Name: comments_postId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "comments_postId_idx" ON public.comments USING btree ("postId");


--
-- Name: discounts_appliedById_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "discounts_appliedById_idx" ON public.discounts USING btree ("appliedById");


--
-- Name: discounts_registrationId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "discounts_registrationId_idx" ON public.discounts USING btree ("registrationId");


--
-- Name: event_line_items_eventId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "event_line_items_eventId_idx" ON public.event_line_items USING btree ("eventId");


--
-- Name: event_line_items_lineItemType_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "event_line_items_lineItemType_idx" ON public.event_line_items USING btree ("lineItemType");


--
-- Name: event_registrations_eventId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "event_registrations_eventId_idx" ON public.event_registrations USING btree ("eventId");


--
-- Name: event_registrations_eventId_userId_key; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE UNIQUE INDEX "event_registrations_eventId_userId_key" ON public.event_registrations USING btree ("eventId", "userId");


--
-- Name: event_registrations_paymentStatus_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "event_registrations_paymentStatus_idx" ON public.event_registrations USING btree ("paymentStatus");


--
-- Name: event_registrations_registeredById_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "event_registrations_registeredById_idx" ON public.event_registrations USING btree ("registeredById");


--
-- Name: event_registrations_userId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "event_registrations_userId_idx" ON public.event_registrations USING btree ("userId");


--
-- Name: events_createdById_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "events_createdById_idx" ON public.events USING btree ("createdById");


--
-- Name: events_eventType_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "events_eventType_idx" ON public.events USING btree ("eventType");


--
-- Name: events_startDate_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "events_startDate_idx" ON public.events USING btree ("startDate");


--
-- Name: events_status_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX events_status_idx ON public.events USING btree (status);


--
-- Name: invite_tokens_token_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX invite_tokens_token_idx ON public.invite_tokens USING btree (token);


--
-- Name: invite_tokens_token_key; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE UNIQUE INDEX invite_tokens_token_key ON public.invite_tokens USING btree (token);


--
-- Name: invite_tokens_userId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "invite_tokens_userId_idx" ON public.invite_tokens USING btree ("userId");


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: payments_userId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "payments_userId_idx" ON public.payments USING btree ("userId");


--
-- Name: post_likes_postId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "post_likes_postId_idx" ON public.post_likes USING btree ("postId");


--
-- Name: post_likes_postId_userId_key; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE UNIQUE INDEX "post_likes_postId_userId_key" ON public.post_likes USING btree ("postId", "userId");


--
-- Name: post_likes_userId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "post_likes_userId_idx" ON public.post_likes USING btree ("userId");


--
-- Name: posts_authorId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "posts_authorId_idx" ON public.posts USING btree ("authorId");


--
-- Name: posts_createdAt_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "posts_createdAt_idx" ON public.posts USING btree ("createdAt");


--
-- Name: posts_isPinned_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "posts_isPinned_idx" ON public.posts USING btree ("isPinned");


--
-- Name: profiles_userId_key; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE UNIQUE INDEX "profiles_userId_key" ON public.profiles USING btree ("userId");


--
-- Name: registration_line_items_lineItemId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "registration_line_items_lineItemId_idx" ON public.registration_line_items USING btree ("lineItemId");


--
-- Name: registration_line_items_registrationId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "registration_line_items_registrationId_idx" ON public.registration_line_items USING btree ("registrationId");


--
-- Name: uploads_uploadedBy_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "uploads_uploadedBy_idx" ON public.uploads USING btree ("uploadedBy");


--
-- Name: users_accountStatus_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "users_accountStatus_idx" ON public.users USING btree ("accountStatus");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_logtoId_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "users_logtoId_idx" ON public.users USING btree ("logtoId");


--
-- Name: users_logtoId_key; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE UNIQUE INDEX "users_logtoId_key" ON public.users USING btree ("logtoId");


--
-- Name: users_referredById_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX "users_referredById_idx" ON public.users USING btree ("referredById");


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: users_username_idx; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE INDEX users_username_idx ON public.users USING btree (username);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: fireuser
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: comments comments_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: discounts discounts_appliedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT "discounts_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: discounts discounts_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT "discounts_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public.event_registrations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_line_items event_line_items_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.event_line_items
    ADD CONSTRAINT "event_line_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT "event_registrations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: event_registrations event_registrations_registeredById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT "event_registrations_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: event_registrations event_registrations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT "event_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: events events_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invite_tokens invite_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.invite_tokens
    ADD CONSTRAINT "invite_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_likes post_likes_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT "post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_likes post_likes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT "post_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: posts posts_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: profiles profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: registration_line_items registration_line_items_lineItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.registration_line_items
    ADD CONSTRAINT "registration_line_items_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES public.event_line_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: registration_line_items registration_line_items_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.registration_line_items
    ADD CONSTRAINT "registration_line_items_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public.event_registrations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_referredById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fireuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict i4LWwDLA9DFKft47C1DjzjxWDBCYzIgc6JvuFYi5ZCg13NwdRWRSddcJNF8v6Ym


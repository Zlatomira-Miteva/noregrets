--
-- PostgreSQL database dump
--

-- Dumped from database version 16.10 (Homebrew)
-- Dumped by pg_dump version 16.11 (Homebrew)

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
-- Name: DiscountType; Type: TYPE; Schema: public; Owner: noregret_mira
--

CREATE TYPE public."DiscountType" AS ENUM (
    'PERCENT',
    'FIXED'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: noregret_mira
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'PAID',
    'FAILED',
    'CANCELLED'
);


--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: noregret_mira
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: noregret_mira
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN'
);


SET default_tablespace = '';

--
-- Name: Account; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


--
-- Name: CakeJar; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."CakeJar" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    layers text[],
    image text NOT NULL,
    price numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CookieOption; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."CookieOption" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    image text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    price numeric(10,2) DEFAULT 0 NOT NULL
);


--
-- Name: Coupon; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."Coupon" (
    id text NOT NULL,
    code text NOT NULL,
    description text,
    "discountType" public."DiscountType" NOT NULL,
    "discountValue" numeric(10,2) NOT NULL,
    "minimumOrderAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "maximumDiscountAmount" numeric(10,2),
    "maxRedemptions" integer,
    "timesRedeemed" integer DEFAULT 0 NOT NULL,
    "validFrom" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Order; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    reference text NOT NULL,
    "customerName" text NOT NULL,
    "customerEmail" text NOT NULL,
    "customerPhone" text NOT NULL,
    "deliveryLabel" text NOT NULL,
    items jsonb NOT NULL,
    "totalAmount" numeric(10,2) NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentUrl" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Product; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    "shortDescription" text,
    description text,
    weight text,
    "leadTime" text,
    "heroImage" text,
    "detailImage" text,
    price numeric(10,2) NOT NULL,
    status public."ProductStatus" DEFAULT 'DRAFT'::public."ProductStatus" NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProductCategory; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."ProductCategory" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    "heroImage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProductCategoryImage; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."ProductCategoryImage" (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    alt text,
    "position" integer DEFAULT 0 NOT NULL
);


--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."ProductImage" (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    alt text,
    "position" integer DEFAULT 0 NOT NULL
);


--
-- Name: ProductVariant; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."ProductVariant" (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    sku text,
    price numeric(10,2) NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL
);

--
-- Name: OrderAuditLog; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."OrderAuditLog" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    action text NOT NULL,
    "oldValue" jsonb,
    "newValue" jsonb,
    "performedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    password text NOT NULL,
    image text,
    role public."UserRole" DEFAULT 'ADMIN'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: noregret_mira
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: CakeJar CakeJar_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."CakeJar"
    ADD CONSTRAINT "CakeJar_pkey" PRIMARY KEY (id);


--
-- Name: CookieOption CookieOption_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."CookieOption"
    ADD CONSTRAINT "CookieOption_pkey" PRIMARY KEY (id);


--
-- Name: Coupon Coupon_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."Coupon"
    ADD CONSTRAINT "Coupon_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);

--
-- Name: OrderAuditLog OrderAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."OrderAuditLog"
    ADD CONSTRAINT "OrderAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: ProductCategoryImage ProductCategoryImage_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."ProductCategoryImage"
    ADD CONSTRAINT "ProductCategoryImage_pkey" PRIMARY KEY (id);


--
-- Name: ProductCategory ProductCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_pkey" PRIMARY KEY (id);


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id);


--
-- Name: ProductVariant ProductVariant_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: CakeJar_slug_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "CakeJar_slug_key" ON public."CakeJar" USING btree (slug);


--
-- Name: CookieOption_slug_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "CookieOption_slug_key" ON public."CookieOption" USING btree (slug);


--
-- Name: Coupon_code_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "Coupon_code_key" ON public."Coupon" USING btree (code);


--
-- Name: Order_reference_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "Order_reference_key" ON public."Order" USING btree (reference);

--
-- Name: OrderAuditLog_orderId_createdAt_idx; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE INDEX "OrderAuditLog_orderId_createdAt_idx" ON public."OrderAuditLog" USING btree ("orderId", "createdAt");


--
-- Name: ProductCategory_slug_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "ProductCategory_slug_key" ON public."ProductCategory" USING btree (slug);


--
-- Name: ProductVariant_sku_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "ProductVariant_sku_key" ON public."ProductVariant" USING btree (sku);


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "Product_slug_key" ON public."Product" USING btree (slug);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: noregret_mira
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: OrderAuditLog OrderAuditLog_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."OrderAuditLog"
    ADD CONSTRAINT "OrderAuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductCategoryImage ProductCategoryImage_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."ProductCategoryImage"
    ADD CONSTRAINT "ProductCategoryImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductImage ProductImage_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductVariant ProductVariant_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ProductCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: noregret_mira
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

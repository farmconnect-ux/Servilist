-- Migration 00012: Roles, permissions and the audit log (master spec sections 16, 37, 70, 105)
--
-- Authorisation is decided in the database: a member's permissions come from
-- their roles, and nothing the browser sends can grant one.

-- ---------------------------------------------------------------------------
-- 1. PROFILE FIELDS FROM THE SPEC (sections 14 and 15)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'banned', 'pending_verification', 'deleted')),
    ADD COLUMN IF NOT EXISTS bio TEXT CHECK (bio IS NULL OR char_length(bio) <= 1000),
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(5),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100);

GRANT SELECT (status, bio, country_code, state) ON public.profiles TO anon, authenticated;
GRANT UPDATE (bio, country_code, state) ON public.profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. RBAC TABLES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE CHECK (key = upper(key)),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);

INSERT INTO public.roles (key, name, description) VALUES
    ('USER', 'Member', 'Buys, sells and posts requests'),
    ('SELLER', 'Seller', 'Reserved for seller-only capabilities'),
    ('SERVICE_PROVIDER', 'Service provider', 'Offers services and quotations'),
    ('BUSINESS_OWNER', 'Business owner', 'Owns a business profile'),
    ('MODERATOR', 'Moderator', 'Reviews listings, requests, reviews and reports'),
    ('SUPPORT_AGENT', 'Support agent', 'Helps members and handles disputes'),
    ('FINANCE_ADMIN', 'Finance admin', 'Payments, payouts and refunds'),
    ('ADMIN', 'Administrator', 'Runs the platform'),
    ('SUPER_ADMIN', 'Super administrator', 'Everything, including roles and settings')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.permissions (key, description) VALUES
    ('admin.access', 'Open the admin area'),
    ('users.read', 'View members'),
    ('users.manage', 'Suspend, restore and ban members'),
    ('roles.manage', 'Grant and revoke roles'),
    ('listings.moderate', 'Pause or remove any listing'),
    ('requests.moderate', 'Pause or remove any request'),
    ('reviews.moderate', 'Hide or remove reviews'),
    ('reports.manage', 'Handle member reports'),
    ('disputes.manage', 'Resolve disputes'),
    ('orders.read', 'View all orders'),
    ('orders.manage', 'Change any order'),
    ('payments.read', 'View payments'),
    ('payments.manage', 'Refund and reconcile payments'),
    ('payouts.manage', 'Approve payouts'),
    ('categories.manage', 'Edit categories'),
    ('verifications.manage', 'Approve identity and business verification'),
    ('settings.manage', 'Change platform settings'),
    ('audit.read', 'Read the audit log')
ON CONFLICT (key) DO NOTHING;

-- Role to permission mapping (members hold no administrative permissions)
WITH mapping(role_key, permission_key) AS (
    VALUES
        ('MODERATOR', 'admin.access'), ('MODERATOR', 'users.read'),
        ('MODERATOR', 'listings.moderate'), ('MODERATOR', 'requests.moderate'),
        ('MODERATOR', 'reviews.moderate'), ('MODERATOR', 'reports.manage'),
        ('SUPPORT_AGENT', 'admin.access'), ('SUPPORT_AGENT', 'users.read'),
        ('SUPPORT_AGENT', 'orders.read'), ('SUPPORT_AGENT', 'disputes.manage'),
        ('SUPPORT_AGENT', 'reports.manage'),
        ('FINANCE_ADMIN', 'admin.access'), ('FINANCE_ADMIN', 'orders.read'),
        ('FINANCE_ADMIN', 'payments.read'), ('FINANCE_ADMIN', 'payments.manage'),
        ('FINANCE_ADMIN', 'payouts.manage')
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM mapping m
JOIN public.roles r ON r.key = m.role_key
JOIN public.permissions p ON p.key = m.permission_key
ON CONFLICT DO NOTHING;

-- Administrators hold everything except role and settings management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'ADMIN' AND p.key NOT IN ('roles.manage', 'settings.manage')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. PERMISSION CHECKS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON rp.role_id = ur.role_id
        JOIN public.permissions p ON p.id = rp.permission_id
        JOIN public.profiles pr ON pr.id = ur.user_id
        WHERE ur.user_id = auth.uid()
          AND p.key = p_permission
          AND pr.status = 'active'
    );
$$;

-- The signed-in member's own roles and permissions, for building their navigation.
CREATE OR REPLACE FUNCTION public.my_access()
RETURNS TABLE (roles TEXT[], permissions TEXT[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        COALESCE(array_agg(DISTINCT r.key) FILTER (WHERE r.key IS NOT NULL), '{}'),
        COALESCE(array_agg(DISTINCT p.key) FILTER (WHERE p.key IS NOT NULL), '{}')
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    LEFT JOIN public.role_permissions rp ON rp.role_id = r.id
    LEFT JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid();
$$;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.roles, public.permissions, public.role_permissions, public.user_roles
    FROM anon, authenticated;
GRANT SELECT ON public.roles, public.permissions, public.role_permissions, public.user_roles
    TO authenticated;

DROP POLICY IF EXISTS "Admins read roles" ON public.roles;
CREATE POLICY "Admins read roles" ON public.roles
    FOR SELECT TO authenticated USING (public.has_permission('admin.access'));

DROP POLICY IF EXISTS "Admins read permissions" ON public.permissions;
CREATE POLICY "Admins read permissions" ON public.permissions
    FOR SELECT TO authenticated USING (public.has_permission('admin.access'));

DROP POLICY IF EXISTS "Admins read role permissions" ON public.role_permissions;
CREATE POLICY "Admins read role permissions" ON public.role_permissions
    FOR SELECT TO authenticated USING (public.has_permission('admin.access'));

DROP POLICY IF EXISTS "Members read own roles, admins read all" ON public.user_roles;
CREATE POLICY "Members read own roles, admins read all" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.has_permission('users.read'));

-- ---------------------------------------------------------------------------
-- 4. AUDIT LOG (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

DROP POLICY IF EXISTS "Auditors read the audit log" ON public.audit_logs;
CREATE POLICY "Auditors read the audit log" ON public.audit_logs
    FOR SELECT TO authenticated USING (public.has_permission('audit.read'));

-- Entries are written only by database functions, with the actor taken from the session.
CREATE OR REPLACE FUNCTION public.write_audit_log(
    p_action TEXT, p_entity_type TEXT, p_entity_id TEXT, p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb));
$$;

-- ---------------------------------------------------------------------------
-- 5. ROLE AND ACCOUNT ADMINISTRATION
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_user_role(p_user_id UUID, p_role_key TEXT, p_grant BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_role_id UUID;
BEGIN
    IF NOT public.has_permission('roles.manage') THEN
        RAISE EXCEPTION 'You are not allowed to change roles';
    END IF;
    SELECT id INTO v_role_id FROM public.roles WHERE key = p_role_key;
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Unknown role';
    END IF;
    IF NOT p_grant AND p_user_id = auth.uid() AND p_role_key = 'SUPER_ADMIN' THEN
        RAISE EXCEPTION 'You cannot remove your own super administrator role';
    END IF;

    IF p_grant THEN
        INSERT INTO public.user_roles (user_id, role_id, granted_by)
        VALUES (p_user_id, v_role_id, auth.uid())
        ON CONFLICT DO NOTHING;
    ELSE
        DELETE FROM public.user_roles WHERE user_id = p_user_id AND role_id = v_role_id;
    END IF;

    PERFORM public.write_audit_log(
        CASE WHEN p_grant THEN 'role.granted' ELSE 'role.revoked' END,
        'user', p_user_id::text, jsonb_build_object('role', p_role_key));
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_status(p_user_id UUID, p_status TEXT, p_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.has_permission('users.manage') THEN
        RAISE EXCEPTION 'You are not allowed to manage members';
    END IF;
    IF p_status NOT IN ('active', 'suspended', 'banned') THEN
        RAISE EXCEPTION 'Unknown status';
    END IF;
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot change your own account status';
    END IF;

    UPDATE public.profiles SET status = p_status WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Member not found';
    END IF;

    PERFORM public.write_audit_log(
        'user.status_changed', 'user', p_user_id::text,
        jsonb_build_object('status', p_status, 'reason', left(COALESCE(p_reason, ''), 500)));
END;
$$;

REVOKE EXECUTE ON FUNCTION
    public.has_permission(TEXT),
    public.my_access(),
    public.write_audit_log(TEXT, TEXT, TEXT, JSONB),
    public.set_user_role(UUID, TEXT, BOOLEAN),
    public.set_user_status(UUID, TEXT, TEXT)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.has_permission(TEXT),
    public.my_access(),
    public.set_user_role(UUID, TEXT, BOOLEAN),
    public.set_user_status(UUID, TEXT, TEXT)
TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. EVERY MEMBER IS A USER; SUSPENDED MEMBERS CANNOT POST
-- ---------------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role_id)
SELECT p.id, r.id FROM public.profiles p CROSS JOIN public.roles r
WHERE r.key = 'USER'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_name TEXT;
BEGIN
    v_name := NULLIF(btrim(left(COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''), 80)), '');
    IF v_name IS NULL THEN
        v_name := COALESCE(NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''), 'Member');
    END IF;

    INSERT INTO public.profiles (id, username, display_name, email, phone, city, country)
    VALUES (
        NEW.id,
        'member-' || replace(NEW.id::text, '-', ''),
        v_name,
        NEW.email,
        NEW.phone,
        NULLIF(left(COALESCE(NEW.raw_user_meta_data ->> 'city', ''), 100), ''),
        NULLIF(left(COALESCE(NEW.raw_user_meta_data ->> 'country', ''), 100), '')
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role_id)
    SELECT NEW.id, r.id FROM public.roles r WHERE r.key = 'USER'
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- A member who is suspended or banned keeps read access but cannot create content.
CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'active');
$$;

REVOKE EXECUTE ON FUNCTION public.is_active_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_member() TO authenticated;

DROP POLICY IF EXISTS "Authenticated users create own listings" ON public.listings;
CREATE POLICY "Authenticated users create own listings" ON public.listings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = seller_id AND public.is_active_member());

DROP POLICY IF EXISTS "Authenticated buyers can post requests" ON public.buyer_requests;
CREATE POLICY "Authenticated buyers can post requests" ON public.buyer_requests
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = buyer_id AND public.is_active_member());

-- Seed Data for Knowledge Graph
-- Realistic enterprise QA scenario: mortgage/financial services

-- ============================================
-- Applications (5)
-- ============================================

INSERT INTO applications (app_key, name, description, team_owner, repo_url) VALUES
('app-auth',       'Auth Service',          'Authentication & authorization service (OAuth2, JWT)',      'Platform Team',   'https://github.com/corp/auth-service'),
('app-mortgage',   'Mortgage Calculator',   'Customer-facing mortgage calculator and pre-qualification', 'QA Team',         'https://github.com/corp/mortgage-calc'),
('app-orders',     'Order Management',      'Loan application processing and order tracking',           'Lending Team',    'https://github.com/corp/order-mgmt'),
('app-docs',       'Document Service',      'Document upload, verification, and storage',               'Platform Team',   'https://github.com/corp/doc-service'),
('app-notify',     'Notification Service',  'Email, SMS, and push notification delivery',               'Platform Team',   'https://github.com/corp/notify-service');

-- ============================================
-- Endpoints (17)
-- ============================================

-- Auth Service endpoints
INSERT INTO endpoints (app_id, method, path, description, auth_required) VALUES
((SELECT id FROM applications WHERE app_key='app-auth'), 'POST', '/auth/login',           'User login with credentials',    FALSE),
((SELECT id FROM applications WHERE app_key='app-auth'), 'POST', '/auth/refresh',         'Refresh JWT token',              TRUE),
((SELECT id FROM applications WHERE app_key='app-auth'), 'GET',  '/auth/me',              'Get current user profile',       TRUE),
((SELECT id FROM applications WHERE app_key='app-auth'), 'POST', '/auth/logout',          'Invalidate session',             TRUE);

-- Mortgage Calculator endpoints
INSERT INTO endpoints (app_id, method, path, description, auth_required) VALUES
((SELECT id FROM applications WHERE app_key='app-mortgage'), 'POST', '/calc/estimate',       'Calculate monthly payment estimate',  FALSE),
((SELECT id FROM applications WHERE app_key='app-mortgage'), 'POST', '/calc/prequalify',     'Pre-qualification submission',        TRUE),
((SELECT id FROM applications WHERE app_key='app-mortgage'), 'GET',  '/calc/rates',          'Get current interest rates',          FALSE);

-- Order Management endpoints
INSERT INTO endpoints (app_id, method, path, description, auth_required) VALUES
((SELECT id FROM applications WHERE app_key='app-orders'), 'POST', '/orders',              'Create new loan application',        TRUE),
((SELECT id FROM applications WHERE app_key='app-orders'), 'GET',  '/orders/:id',          'Get order details',                  TRUE),
((SELECT id FROM applications WHERE app_key='app-orders'), 'PUT',  '/orders/:id/status',   'Update order status',                TRUE),
((SELECT id FROM applications WHERE app_key='app-orders'), 'GET',  '/orders',              'List all orders for user',           TRUE);

-- Document Service endpoints
INSERT INTO endpoints (app_id, method, path, description, auth_required) VALUES
((SELECT id FROM applications WHERE app_key='app-docs'), 'POST', '/docs/upload',         'Upload verification document',       TRUE),
((SELECT id FROM applications WHERE app_key='app-docs'), 'GET',  '/docs/:id',            'Download document',                  TRUE),
((SELECT id FROM applications WHERE app_key='app-docs'), 'GET',  '/docs/order/:orderId', 'List documents for an order',        TRUE);

-- Notification Service endpoints
INSERT INTO endpoints (app_id, method, path, description, auth_required) VALUES
((SELECT id FROM applications WHERE app_key='app-notify'), 'POST', '/notify/email',        'Send email notification',            TRUE),
((SELECT id FROM applications WHERE app_key='app-notify'), 'POST', '/notify/sms',          'Send SMS notification',              TRUE),
((SELECT id FROM applications WHERE app_key='app-notify'), 'GET',  '/notify/preferences',  'Get user notification preferences',  TRUE);

-- ============================================
-- Requirements / Jira Tickets (16)
-- ============================================

INSERT INTO requirements (jira_key, summary, description, priority, status, app_id) VALUES
-- Auth requirements
('QA-101', 'User login with valid credentials',         'Users must be able to log in with email/password and receive a JWT token',                   'Critical', 'Done',        (SELECT id FROM applications WHERE app_key='app-auth')),
('QA-102', 'User login with invalid credentials',       'System should return 401 with clear error message for bad credentials',                     'Critical', 'Done',        (SELECT id FROM applications WHERE app_key='app-auth')),
('QA-103', 'Session timeout and token refresh',          'JWT tokens expire after 15min, refresh tokens valid for 7 days',                           'High',     'In Progress', (SELECT id FROM applications WHERE app_key='app-auth')),
('QA-104', 'Multi-factor authentication',                'Support TOTP-based MFA for all user accounts',                                             'High',     'Open',        (SELECT id FROM applications WHERE app_key='app-auth')),

-- Mortgage Calculator requirements
('QA-201', 'Calculate monthly payment',                  'Given principal, rate, and term, calculate correct monthly payment',                        'Critical', 'Done',        (SELECT id FROM applications WHERE app_key='app-mortgage')),
('QA-202', 'Pre-qualification form submission',          'User fills out income, debt, credit score and gets pre-qual decision',                      'Critical', 'In Progress', (SELECT id FROM applications WHERE app_key='app-mortgage')),
('QA-203', 'Rate display accuracy',                      'Current rates should update daily and display with 3 decimal precision',                    'Medium',   'Done',        (SELECT id FROM applications WHERE app_key='app-mortgage')),
('QA-204', 'Accessibility compliance (WCAG 2.1 AA)',     'All calculator forms must meet WCAG 2.1 AA accessibility standards',                       'High',     'Open',        (SELECT id FROM applications WHERE app_key='app-mortgage')),

-- Order Management requirements
('QA-301', 'Create loan application order',              'Authenticated user can submit a new loan application with all required fields',             'Critical', 'Done',        (SELECT id FROM applications WHERE app_key='app-orders')),
('QA-302', 'Order status tracking',                      'Users can view current status and full history of their loan application',                  'High',     'Done',        (SELECT id FROM applications WHERE app_key='app-orders')),
('QA-303', 'Order cancellation within 3 days',           'Users can cancel loan application within 3 business days of submission',                   'Medium',   'Open',        (SELECT id FROM applications WHERE app_key='app-orders')),
('QA-304', 'Concurrent order limit',                     'Users cannot have more than 3 active loan applications simultaneously',                    'Medium',   'Open',        (SELECT id FROM applications WHERE app_key='app-orders')),

-- Document Service requirements
('QA-401', 'Document upload for loan application',       'Users can upload PDF/JPG documents (max 10MB) linked to their loan application',           'Critical', 'Done',        (SELECT id FROM applications WHERE app_key='app-docs')),
('QA-402', 'Document type validation',                   'System rejects unsupported file types and files exceeding size limit',                     'High',     'Open',        (SELECT id FROM applications WHERE app_key='app-docs')),

-- Notification Service requirements
('QA-501', 'Email notification on order status change',  'Users receive email when their loan application status changes',                           'High',     'In Progress', (SELECT id FROM applications WHERE app_key='app-notify')),
('QA-502', 'SMS notification opt-in',                    'Users can opt in/out of SMS notifications for their applications',                         'Medium',   'Open',        (SELECT id FROM applications WHERE app_key='app-notify'));

-- ============================================
-- Tests (11 Playwright tests)
-- ============================================

INSERT INTO tests (test_key, name, file_path, test_type, status, last_result, last_run_at, flaky_count, avg_duration_ms, app_id) VALUES
-- Auth tests
('test-auth-login-valid',     'Login with valid credentials',         'tests/auth/login.spec.ts',          'e2e',         'active', 'pass', NOW() - INTERVAL '2 hours',  0, 3200,  (SELECT id FROM applications WHERE app_key='app-auth')),
('test-auth-login-invalid',   'Login with invalid credentials',       'tests/auth/login-invalid.spec.ts',  'e2e',         'active', 'pass', NOW() - INTERVAL '2 hours',  1, 2800,  (SELECT id FROM applications WHERE app_key='app-auth')),
('test-auth-token-refresh',   'Token refresh flow',                   'tests/auth/token-refresh.spec.ts',  'e2e',         'active', 'fail', NOW() - INTERVAL '1 hour',   5, 8500,  (SELECT id FROM applications WHERE app_key='app-auth')),

-- Mortgage Calculator tests
('test-calc-monthly',         'Monthly payment calculation',          'tests/calc/payment.spec.ts',        'e2e',         'active', 'pass', NOW() - INTERVAL '3 hours',  0, 4100,  (SELECT id FROM applications WHERE app_key='app-mortgage')),
('test-calc-prequalify',      'Pre-qualification form submission',    'tests/calc/prequalify.spec.ts',     'e2e',         'active', 'pass', NOW() - INTERVAL '3 hours',  3, 12500, (SELECT id FROM applications WHERE app_key='app-mortgage')),
('test-calc-rates',           'Rate display and accuracy',            'tests/calc/rates.spec.ts',          'integration', 'active', 'pass', NOW() - INTERVAL '4 hours',  0, 1800,  (SELECT id FROM applications WHERE app_key='app-mortgage')),

-- Order Management tests
('test-orders-create',        'Create loan application',              'tests/orders/create.spec.ts',       'e2e',         'active', 'pass', NOW() - INTERVAL '1 hour',   2, 9800,  (SELECT id FROM applications WHERE app_key='app-orders')),
('test-orders-status',        'Order status tracking',                'tests/orders/status.spec.ts',       'e2e',         'active', 'pass', NOW() - INTERVAL '1 hour',   0, 6200,  (SELECT id FROM applications WHERE app_key='app-orders')),

-- Document Service tests
('test-docs-upload',          'Document upload flow',                 'tests/docs/upload.spec.ts',         'e2e',         'active', 'fail', NOW() - INTERVAL '30 minutes', 7, 15000, (SELECT id FROM applications WHERE app_key='app-docs')),

-- Cross-app tests
('test-e2e-full-application', 'Full loan application flow (end-to-end)', 'tests/e2e/full-application.spec.ts', 'e2e',    'active', 'pass', NOW() - INTERVAL '6 hours',  4, 45000, (SELECT id FROM applications WHERE app_key='app-orders')),
('test-e2e-login-to-upload',  'Login through document upload',        'tests/e2e/login-to-upload.spec.ts', 'e2e',         'active', 'fail', NOW() - INTERVAL '1 hour',   8, 22000, (SELECT id FROM applications WHERE app_key='app-docs'));

-- ============================================
-- Requirement ↔ Test Coverage
-- ============================================

INSERT INTO requirement_covered_by_test (requirement_id, test_id, coverage_type) VALUES
((SELECT id FROM requirements WHERE jira_key='QA-101'), (SELECT id FROM tests WHERE test_key='test-auth-login-valid'),     'full'),
((SELECT id FROM requirements WHERE jira_key='QA-102'), (SELECT id FROM tests WHERE test_key='test-auth-login-invalid'),   'full'),
((SELECT id FROM requirements WHERE jira_key='QA-103'), (SELECT id FROM tests WHERE test_key='test-auth-token-refresh'),   'partial'),
((SELECT id FROM requirements WHERE jira_key='QA-201'), (SELECT id FROM tests WHERE test_key='test-calc-monthly'),         'full'),
((SELECT id FROM requirements WHERE jira_key='QA-202'), (SELECT id FROM tests WHERE test_key='test-calc-prequalify'),      'partial'),
((SELECT id FROM requirements WHERE jira_key='QA-203'), (SELECT id FROM tests WHERE test_key='test-calc-rates'),           'full'),
((SELECT id FROM requirements WHERE jira_key='QA-301'), (SELECT id FROM tests WHERE test_key='test-orders-create'),        'full'),
((SELECT id FROM requirements WHERE jira_key='QA-301'), (SELECT id FROM tests WHERE test_key='test-e2e-full-application'), 'full'),
((SELECT id FROM requirements WHERE jira_key='QA-302'), (SELECT id FROM tests WHERE test_key='test-orders-status'),        'full'),
((SELECT id FROM requirements WHERE jira_key='QA-401'), (SELECT id FROM tests WHERE test_key='test-docs-upload'),          'full'),
((SELECT id FROM requirements WHERE jira_key='QA-401'), (SELECT id FROM tests WHERE test_key='test-e2e-login-to-upload'),  'partial');
-- Note: QA-104, QA-204, QA-303, QA-304, QA-402, QA-501, QA-502 have NO test coverage (coverage gaps)

-- ============================================
-- Test ↔ Endpoint Mapping
-- ============================================

INSERT INTO test_hits_endpoint (test_id, endpoint_id, hit_count) VALUES
-- Login tests hit auth endpoints
((SELECT id FROM tests WHERE test_key='test-auth-login-valid'),    (SELECT id FROM endpoints WHERE path='/auth/login' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-auth-login-valid'),    (SELECT id FROM endpoints WHERE path='/auth/me' AND method='GET'), 1),
((SELECT id FROM tests WHERE test_key='test-auth-login-invalid'),  (SELECT id FROM endpoints WHERE path='/auth/login' AND method='POST'), 3),
((SELECT id FROM tests WHERE test_key='test-auth-token-refresh'),  (SELECT id FROM endpoints WHERE path='/auth/login' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-auth-token-refresh'),  (SELECT id FROM endpoints WHERE path='/auth/refresh' AND method='POST'), 2),

-- Calculator tests
((SELECT id FROM tests WHERE test_key='test-calc-monthly'),        (SELECT id FROM endpoints WHERE path='/calc/estimate' AND method='POST'), 5),
((SELECT id FROM tests WHERE test_key='test-calc-prequalify'),     (SELECT id FROM endpoints WHERE path='/auth/login' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-calc-prequalify'),     (SELECT id FROM endpoints WHERE path='/calc/prequalify' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-calc-rates'),          (SELECT id FROM endpoints WHERE path='/calc/rates' AND method='GET'), 1),

-- Order tests
((SELECT id FROM tests WHERE test_key='test-orders-create'),       (SELECT id FROM endpoints WHERE path='/auth/login' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-orders-create'),       (SELECT id FROM endpoints WHERE path='/orders' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-orders-status'),       (SELECT id FROM endpoints WHERE path='/auth/login' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-orders-status'),       (SELECT id FROM endpoints WHERE path='/orders/:id' AND method='GET'), 3),

-- Document tests
((SELECT id FROM tests WHERE test_key='test-docs-upload'),         (SELECT id FROM endpoints WHERE path='/auth/login' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-docs-upload'),         (SELECT id FROM endpoints WHERE path='/docs/upload' AND method='POST'), 2),

-- E2E full flow hits many endpoints
((SELECT id FROM tests WHERE test_key='test-e2e-full-application'), (SELECT id FROM endpoints WHERE path='/auth/login' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-e2e-full-application'), (SELECT id FROM endpoints WHERE path='/calc/prequalify' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-e2e-full-application'), (SELECT id FROM endpoints WHERE path='/orders' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-e2e-full-application'), (SELECT id FROM endpoints WHERE path='/docs/upload' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-e2e-full-application'), (SELECT id FROM endpoints WHERE path='/orders/:id' AND method='GET'), 2),

-- Login-to-upload flow
((SELECT id FROM tests WHERE test_key='test-e2e-login-to-upload'), (SELECT id FROM endpoints WHERE path='/auth/login' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-e2e-login-to-upload'), (SELECT id FROM endpoints WHERE path='/docs/upload' AND method='POST'), 1),
((SELECT id FROM tests WHERE test_key='test-e2e-login-to-upload'), (SELECT id FROM endpoints WHERE path='/docs/:id' AND method='GET'), 1);

-- ============================================
-- Endpoint ↔ Endpoint Dependencies
-- ============================================

-- Mortgage calc pre-qualify calls auth to validate token
INSERT INTO endpoint_depends_on_endpoint (source_endpoint_id, target_endpoint_id, dependency_type) VALUES
((SELECT id FROM endpoints WHERE path='/calc/prequalify' AND method='POST'),
 (SELECT id FROM endpoints WHERE path='/auth/me' AND method='GET'), 'sync');

-- Order creation calls auth + notification
INSERT INTO endpoint_depends_on_endpoint (source_endpoint_id, target_endpoint_id, dependency_type) VALUES
((SELECT id FROM endpoints WHERE path='/orders' AND method='POST'),
 (SELECT id FROM endpoints WHERE path='/auth/me' AND method='GET'), 'sync'),
((SELECT id FROM endpoints WHERE path='/orders' AND method='POST'),
 (SELECT id FROM endpoints WHERE path='/notify/email' AND method='POST'), 'async');

-- Order status update triggers notifications
INSERT INTO endpoint_depends_on_endpoint (source_endpoint_id, target_endpoint_id, dependency_type) VALUES
((SELECT id FROM endpoints WHERE path='/orders/:id/status' AND method='PUT'),
 (SELECT id FROM endpoints WHERE path='/notify/email' AND method='POST'), 'async'),
((SELECT id FROM endpoints WHERE path='/orders/:id/status' AND method='PUT'),
 (SELECT id FROM endpoints WHERE path='/notify/sms' AND method='POST'), 'async');

-- Document upload calls auth + links to orders
INSERT INTO endpoint_depends_on_endpoint (source_endpoint_id, target_endpoint_id, dependency_type) VALUES
((SELECT id FROM endpoints WHERE path='/docs/upload' AND method='POST'),
 (SELECT id FROM endpoints WHERE path='/auth/me' AND method='GET'), 'sync'),
((SELECT id FROM endpoints WHERE path='/docs/upload' AND method='POST'),
 (SELECT id FROM endpoints WHERE path='/orders/:id' AND method='GET'), 'sync');

-- Document listing for order depends on auth
INSERT INTO endpoint_depends_on_endpoint (source_endpoint_id, target_endpoint_id, dependency_type) VALUES
((SELECT id FROM endpoints WHERE path='/docs/order/:orderId' AND method='GET'),
 (SELECT id FROM endpoints WHERE path='/auth/me' AND method='GET'), 'sync');

-- ============================================
-- Test Results History (sample run data)
-- ============================================

INSERT INTO test_results_history (test_id, result, duration_ms, error_message, run_at, build_id) VALUES
-- Recent runs for flaky token refresh test
((SELECT id FROM tests WHERE test_key='test-auth-token-refresh'), 'pass', 8200, NULL,                                    NOW() - INTERVAL '3 days',  'build-440'),
((SELECT id FROM tests WHERE test_key='test-auth-token-refresh'), 'fail', 8900, 'Timeout waiting for token refresh',     NOW() - INTERVAL '2 days',  'build-441'),
((SELECT id FROM tests WHERE test_key='test-auth-token-refresh'), 'pass', 8100, NULL,                                    NOW() - INTERVAL '36 hours', 'build-442'),
((SELECT id FROM tests WHERE test_key='test-auth-token-refresh'), 'fail', 9200, 'Timeout waiting for token refresh',     NOW() - INTERVAL '1 day',   'build-443'),
((SELECT id FROM tests WHERE test_key='test-auth-token-refresh'), 'fail', 8700, 'Connection refused on refresh endpoint', NOW() - INTERVAL '1 hour',  'build-444'),

-- Recent runs for flaky doc upload test
((SELECT id FROM tests WHERE test_key='test-docs-upload'), 'pass', 14200, NULL,                                          NOW() - INTERVAL '4 days',  'build-438'),
((SELECT id FROM tests WHERE test_key='test-docs-upload'), 'fail', 15800, 'File upload timeout after 30s',               NOW() - INTERVAL '3 days',  'build-440'),
((SELECT id FROM tests WHERE test_key='test-docs-upload'), 'fail', 16100, 'File upload timeout after 30s',               NOW() - INTERVAL '2 days',  'build-441'),
((SELECT id FROM tests WHERE test_key='test-docs-upload'), 'pass', 13900, NULL,                                          NOW() - INTERVAL '1 day',   'build-443'),
((SELECT id FROM tests WHERE test_key='test-docs-upload'), 'fail', 15500, '500 Internal Server Error on /docs/upload',   NOW() - INTERVAL '30 minutes', 'build-444'),

-- Stable test runs
((SELECT id FROM tests WHERE test_key='test-auth-login-valid'),    'pass', 3100, NULL, NOW() - INTERVAL '2 hours', 'build-444'),
((SELECT id FROM tests WHERE test_key='test-auth-login-invalid'),  'pass', 2900, NULL, NOW() - INTERVAL '2 hours', 'build-444'),
((SELECT id FROM tests WHERE test_key='test-calc-monthly'),        'pass', 4000, NULL, NOW() - INTERVAL '3 hours', 'build-444'),
((SELECT id FROM tests WHERE test_key='test-orders-create'),       'pass', 9600, NULL, NOW() - INTERVAL '1 hour',  'build-444'),
((SELECT id FROM tests WHERE test_key='test-orders-status'),       'pass', 6100, NULL, NOW() - INTERVAL '1 hour',  'build-444'),
((SELECT id FROM tests WHERE test_key='test-e2e-full-application'),'pass', 44000,NULL, NOW() - INTERVAL '6 hours', 'build-443');

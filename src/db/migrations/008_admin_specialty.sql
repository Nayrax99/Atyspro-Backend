-- 008 : Renommer specialty 'autre' → 'admin'
UPDATE accounts SET specialty = 'admin' WHERE specialty = 'autre';

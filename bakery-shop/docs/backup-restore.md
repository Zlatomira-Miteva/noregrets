# Backup & Restore Playbook

Daily/weekly steps (owner or DB admin account):

1) Full daily dump (keep 7–14 days):
```
pg_dump "$DATABASE_URL" --format=custom --file=/path/to/backups/noregrets_$(date +%F).dump
```
2) Optional: gzip older dumps to save space.
3) Monthly restore test (on a staging DB):
```
createdb noregrets_restore_test
pg_restore --clean --no-owner --dbname=noregrets_restore_test /path/to/backups/noregrets_YYYY-MM-DD.dump
```
4) Verify basic integrity on the restore test:
```
psql noregrets_restore_test -c "SELECT COUNT(*) FROM \"Order\";"
psql noregrets_restore_test -c "SELECT COUNT(*) FROM \"User\";"
```
5) Rotate old backups (keep at least 30 days of weekly/monthly snapshots).

Notes:
- Run the dump with the owner user (e.g. `noregret_shop`) to ensure all objects are included.
- Store backups off the app server (object storage or another host).
- Document where backups are stored and how to access credentials.
- After a real restore, point the app to the restored DB only after sanity checks (counts, random spot checks). 

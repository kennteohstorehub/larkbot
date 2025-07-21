# Deployment Status

Last updated: 2025-07-21T03:30:00Z

## Fixed Issues:
1. ✅ Fixed rootDir in render.yaml to point to Development/larkbot
2. ✅ Fixed Intercom API crash (admins.me() -> admins.list())
3. ✅ Added missing LARK_CHAT_GROUP_ID_MYPHFE environment variable
4. ✅ Set health check path to /health
5. ✅ Updated character limit to 2000 for both text and card formats
6. ✅ Changed primary notification group to Complex Setup Process
7. ✅ Added all Intercom credentials to enable LIVE mode
8. ✅ Set NODE_ENV=production

## Environment Variables Configured:
- LARK_CHAT_GROUP_ID = oc_3b7d749c2b3c06bb75606db9bc7ce267 (Complex Setup Process - Primary group for site inspection tickets)
- LARK_CHAT_GROUP_ID_COMPLEX_SETUP = oc_3b7d749c2b3c06bb75606db9bc7ce267 (Complex Setup Process)
- LARK_CHAT_GROUP_ID_MYPHFE = oc_03378fd292afd3ff7cd5661a27d8f463 (MY/PH FE)

## Service URL:
https://l2-onsite-monitor.onrender.com

## Production Status: ✅ LIVE
- Site inspection tickets are being captured and sent to Complex Setup Process group
- Character limit: 2000 characters for full message visibility
- Service running in LIVE mode with real Intercom data
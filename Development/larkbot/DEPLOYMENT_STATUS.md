# Deployment Status

Last updated: 2025-07-21T02:44:16Z

## Fixed Issues:
1. ✅ Fixed rootDir in render.yaml to point to Development/larkbot
2. ✅ Fixed Intercom API crash (admins.me() -> admins.list())
3. ✅ Added missing LARK_CHAT_GROUP_ID_MYPHFE environment variable
4. ✅ Set health check path to /health

## Environment Variables Configured:
- LARK_CHAT_GROUP_ID = oc_3b7d749c2b3c06bb75606db9bc7ce267 (Complex Setup Process - Primary group for site inspection tickets)
- LARK_CHAT_GROUP_ID_COMPLEX_SETUP = oc_3b7d749c2b3c06bb75606db9bc7ce267 (Complex Setup Process)
- LARK_CHAT_GROUP_ID_MYPHFE = oc_03378fd292afd3ff7cd5661a27d8f463 (MY/PH FE)

## Service URL:
https://l2-onsite-monitor.onrender.com

## Deployment should now succeed with all fixes applied.
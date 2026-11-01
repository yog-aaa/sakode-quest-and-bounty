import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(req: Request) {
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
  };

  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  // 1. Periksa Environment Variables
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;

  const envCheck: Record<string, unknown> = {
    hasProjectId: !!projectId,
    projectIdValue: projectId || null,
    hasClientEmail: !!clientEmail,
    clientEmailPreview: clientEmail ? `${clientEmail.slice(0, 15)}...` : null,
    hasPrivateKey: !!rawPrivateKey,
    privateKeyLength: rawPrivateKey ? rawPrivateKey.length : 0,
    hasServiceAccountJson: !!rawServiceAccount,
  };

  if (!rawPrivateKey && rawServiceAccount) {
    try {
      let str = rawServiceAccount.trim();
      if (!str.startsWith('{')) {
        str = Buffer.from(str, 'base64').toString('utf8');
      }
      const parsed = JSON.parse(str);
      rawPrivateKey = parsed.private_key;
      envCheck.serviceAccountParsed = true;
    } catch (e) {
      envCheck.serviceAccountParseError = e instanceof Error ? e.message : String(e);
    }
  }

  result.envCheck = envCheck;

  // 2. Normalisasi Private Key
  let cleanKey: string | null = null;
  if (rawPrivateKey) {
    let key = rawPrivateKey.trim();
    while ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1).trim();
    }
    key = key.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
    cleanKey = key;

    result.keyCheck = {
      hasBeginHeader: key.includes('-----BEGIN PRIVATE KEY-----'),
      hasEndFooter: key.includes('-----END PRIVATE KEY-----'),
      lineCount: key.split('\n').length,
    };
  }

  // 3. Uji Inisialisasi Firebase Admin
  try {
    let app;
    const existing = getApps();
    const appName = 'debug_app_' + Date.now();

    if (projectId && clientEmail && cleanKey) {
      app = initializeApp(
        {
          credential: cert({
            projectId,
            clientEmail,
            privateKey: cleanKey,
          }),
        },
        appName
      );
      result.adminInitSuccess = true;
    } else {
      result.adminInitSuccess = false;
      result.adminInitError = 'Variabel FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, atau FIREBASE_PRIVATE_KEY tidak lengkap.';
    }

    // 4. Uji Baca Firestore
    if (app && uid) {
      try {
        const db = getFirestore(app);
        const userDoc = await db.collection('users').doc(uid).get();
        result.firestoreTest = {
          success: true,
          userDocExists: userDoc.exists,
          userData: userDoc.exists
            ? {
                role: userDoc.data()?.role,
                approvalStatus: userDoc.data()?.approvalStatus,
                email: userDoc.data()?.email,
              }
            : null,
        };
      } catch (dbErr) {
        result.firestoreTest = {
          success: false,
          error: dbErr instanceof Error ? dbErr.message : String(dbErr),
        };
      }
    }
  } catch (initErr) {
    result.adminInitSuccess = false;
    result.adminInitError = initErr instanceof Error ? initErr.message : String(initErr);
  }

  return NextResponse.json(result, { status: 200 });
}

import 'dotenv/config';

import { createCorsair } from 'corsair';

import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { conn } from './db';


export const corsair = createCorsair({
    plugins: [ 
        gmail({
            authType: "oauth_2",
            credentials: {
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            },
        }),
        googlecalendar({
            authType: "oauth_2",
            credentials: {
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            },
        }),
    ],
    database: conn,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});
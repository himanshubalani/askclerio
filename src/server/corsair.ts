import 'dotenv/config';

import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { conn } from './db';

export const corsair = createCorsair({
    plugins: [ 
        /**
         * Both plugins use `permissive` mode to prevent double-confirmation UX:
         * the in-app ToolCallCard approval flow handles all write-operation gating,
         * so Corsair's server-side interception (cautious/strict) must be disabled.
         * For hard-blocking specific operations (e.g. email deletion), use Deny_Overrides
         * rather than switching plugin mode — this keeps the approval UX consistent
         * while still enforcing unconditional denials at the server level.
         */
        gmail({ 
            authType: "oauth_2",
            mode: "permissive",
            deny: ["gmail.api.messages.delete"],
        }), 
        googlecalendar({ 
            authType: "oauth_2",
            mode: "permissive",
        }) 
    ],
    database: conn,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});
import 'dotenv/config';

import { createCorsair } from 'corsair';
import { github } from '@corsair-dev/github';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { conn } from './db';


export const corsair = createCorsair({
    plugins: [github(), gmail(), googlecalendar()],
    database: conn,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});
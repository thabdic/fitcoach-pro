import {test as setup,expect} from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { ACCOUNTS, BACKEND_URL, FRONTEND_URL } from '../config/credentials'

const ROLES = [
    { account: ACCOUNTS.admin,   file: '.auth/admin.json' },
    { account: ACCOUNTS.trainer, file: '.auth/trainer.json' },
    { account: ACCOUNTS.client,  file: '.auth/client.json' },
  ];

  for (const role of ROLES){
    setup(`authenticate as ${role.account.role}`,async({request})=>{
        const response = await request.post(`${BACKEND_URL}/auth/login`,{
            data:{email:role.account.email,password:role.account.password}
        });
        expect(response.ok()).toBeTruthy();

        const {data} = await response.json();

        const state = {
            cookies:[],
            origins:[
                {
                    origin:FRONTEND_URL,
                    localStorage: [
                        {name:'fitcoach_token',value:data.token},
                        {name:'fitcoach_user',value:JSON.stringify(data.user)},
                    ],
                },
            ],
        };
      const out = path.resolve(__dirname, '..', role.file);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, JSON.stringify(state, null, 2));
    })
  }

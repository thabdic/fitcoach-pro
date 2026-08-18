import { test as setup } from '@playwright/test';
import { execSync } from 'node:child_process';

import path from 'node:path';

setup('Reseed database to known baseline',()=>{
    const backendDirectory = path.resolve(__dirname,'../../../backend');
    execSync('npm run seed',{cwd:backendDirectory,stdio:'inherit'});
})
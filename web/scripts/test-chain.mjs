// Quick check that the live reads work against the deployed testnet package.
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const PKG = '0x637b1764edaac8380c4b8c324bdf9fc3d97694da9fef1dd8cf0fd3af76a66f59';
const TREASURY = '0xc46863ba787082ef56186954c559ac9c4bcdc2db6e7b220420b7df4ab9bad1cc';
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

const t = await client.getObject({ id: TREASURY, options: { showContent: true } });
console.log('TREASURY fields:', t.data?.content?.fields);

const dis = await client.queryEvents({ query: { MoveEventType: `${PKG}::underwriter::LoanDisbursed` }, order: 'descending' });
console.log('LoanDisbursed count:', dis.data.length);
dis.data.slice(0, 3).forEach((e) => console.log('  ', JSON.stringify(e.parsedJson)));

const rep = await client.queryEvents({ query: { MoveEventType: `${PKG}::reputation::ReputationUpdated` }, order: 'descending' });
console.log('ReputationUpdated count:', rep.data.length);
rep.data.slice(0, 3).forEach((e) => console.log('  ', JSON.stringify(e.parsedJson)));

// A project-specific tripwire, not a guarantee or substitute for human review.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const root=path.join(__dirname,'..');
const ignored=new Set(['.git','node_modules','dist','artifacts','.worktrees','.superpowers']);
const failures=[];
// One exact official derivative is allowed; photographs remain prohibited.
const approvedAssets=new Map([['assets/brand/dotai-icon.png','923d95b80e8f917eb28dd9afa72d3e19b3ad5a506f4024375bc3c5829722234e']]);
function checkAsset(relative,bytes,label=relative){
  if(createHash('sha256').update(bytes).digest('hex')!==approvedAssets.get(relative))failures.push(label+' does not match the approved brand asset');
}
const privatePath=new RegExp('/'+'Users/|/'+'home/|[A-Z]:\\\\Users\\\\');
const photoName=new RegExp('3Q'+'0A\\d{4}','i');
const credentials=new RegExp('-----BEGIN '+'(?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}');
function check(relative,text){
  if(privatePath.test(text)||photoName.test(text)||credentials.test(text))failures.push(relative+' contains a private-path, photo-name or credential pattern');
}
function walk(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  if(ignored.has(entry.name))continue;
  const full=path.join(folder,entry.name),relative=path.relative(root,full);
  if(entry.isSymbolicLink()){failures.push(relative+' is a symlink');continue;}
  if(entry.isDirectory()){walk(full);continue;}
  if(approvedAssets.has(relative)){checkAsset(relative,fs.readFileSync(full));continue;}
  if(!/\.(?:js|cjs|css|json|md|yml|yaml|template)$/.test(entry.name)&&!['.gitignore','LICENSE'].includes(entry.name)){failures.push(relative+' is not an approved source/document type');continue;}
  check(relative,fs.readFileSync(full,'utf8'));
}}
walk(root);
// Check the staged/index versions too, so ignore rules cannot mask committed photos.
const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
for(const relative of files){
  if(approvedAssets.has(relative)){
    checkAsset(relative,execFileSync('git',['show',`:${relative}`],{cwd:root,maxBuffer:1024*1024}),'index:'+relative);continue;
  }
  if(/^(?:dist|artifacts|node_modules)\/|\.(?:jpe?g|png|webp|heic|pdf|html)$/i.test(relative))failures.push(relative+' must not be tracked');
  const text=execFileSync('git',['show',`:${relative}`],{cwd:root,encoding:'utf8',maxBuffer:10*1024*1024});check('index:'+relative,text);
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('PASS: source/index privacy tripwires; only the exact approved brand image is permitted.');

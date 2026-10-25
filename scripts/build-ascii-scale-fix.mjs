// Rebuild the MIT-licensed upstream archive with only transformed text sizing fixed.
// DOM Range coordinates already include ancestor scale; canvas fonts must include it too.
import {mkdtemp,readFile,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
const dir=await mkdtemp(path.join(tmpdir(),'ascii-scale-'))
execFileSync('tar',['-xzf','vendor/ascii-reveal-0.3.0.tgz','-C',dir])
const helper=`function __arScaledFontSize(node, size) {
  let scale = 1;
  for (let el = node.parentElement; el; el = el.parentElement) {
    const transform = getComputedStyle(el).transform;
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(transform);
      scale *= Math.hypot(matrix.a, matrix.b);
    }
  }
  return (parseFloat(size) * scale) + 'px';
}\n`
for(const name of ['core.js','core.cjs','index.js','index.cjs']){
 const file=path.join(dir,'package/dist',name)
 let code=await readFile(file,'utf8'),matches=0
 // Only the paired real-text and scramble fonts inside textTarget, not skeleton fonts.
 code=code.replace(/(let \w+=`\$\{(\w+)\.fontStyle\} \$\{\2\.fontWeight\} )\$\{\2\.fontSize\}( \$\{\2\.fontFamily\}`,\w+=`400 )\$\{\2\.fontSize\}/g,(_,a,style,b)=>{
  matches++
  return a+'${__arScaledFontSize(e,'+style+'.fontSize)}'+b+'${__arScaledFontSize(e,'+style+'.fontSize)}'
 })
 if(matches!==1)throw Error('Upstream textTarget changed: '+name+' matches='+matches)
 await writeFile(file,code+'\n'+helper)
}
const pkgPath=path.join(dir,'package/package.json');const pkg=JSON.parse(await readFile(pkgPath,'utf8'));pkg.version='0.3.0-interverse.1';await writeFile(pkgPath,JSON.stringify(pkg,null,2)+'\n')
execFileSync('tar',['-czf',path.resolve('vendor/ascii-reveal-0.3.0-interverse.1.tgz'),'-C',dir,'package'])

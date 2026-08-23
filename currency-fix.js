const currencyOptions={'USD — US Dollar':{symbol:'$',label:'USD'},'EGP — Egyptian Pound':{symbol:'ج.م',label:'EGP'}};
function selectedCurrency(){return localStorage.getItem('velora-currency')||'USD — US Dollar'}
function currencySymbol(){return currencyOptions[selectedCurrency()]?.symbol||'$'}
function applyCurrency(root=document.body){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(node=>{if(['SCRIPT','STYLE'].includes(node.parentElement?.tagName))return;let value=node.nodeValue.replace(/\$|ج\.م|€|£/g,currencySymbol());if(selectedCurrency().startsWith('EGP'))value=value.replace(/Price \(USD\)/g,'Price (EGP)');if(value!==node.nodeValue)node.nodeValue=value})}
function syncCurrencySetting(){const select=document.querySelector('select[name="currency"]');if(select&&!select.dataset.currencyReady){select.value=selectedCurrency();select.dataset.currencyReady='true'}}
document.addEventListener('click',event=>{if(event.target.id==='saveStoreSettings'){const select=document.querySelector('select[name="currency"]');if(select){localStorage.setItem('velora-currency',select.value);setTimeout(()=>applyCurrency(),50)}}});
let currencyRefreshQueued=false;
const currencyHost=document.getElementById('dynamicPage');
if(currencyHost)new MutationObserver(()=>{if(currencyRefreshQueued)return;currencyRefreshQueued=true;requestAnimationFrame(()=>{currencyRefreshQueued=false;syncCurrencySetting();applyCurrency(currencyHost)})}).observe(currencyHost,{childList:true,subtree:true});
syncCurrencySetting();applyCurrency();

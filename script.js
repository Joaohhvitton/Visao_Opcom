Chart.register(ChartDataLabels);

// ================= USERS

const USERS = {
admin:{pass:"123",role:"admin"},
viewer:{pass:"123",role:"viewer"}
};

let base=[];
let dark=false;

const baseColor="#530F0A";
const accent="#ff6b57";

// ================= LOGIN

function doLogin(){
function doLogin(){

loginError.innerText="";
loginBtn.classList.add("loading");
loginText.innerText="Validando...";

}

setTimeout(()=>{

let u=user.value.trim();
let p=pass.value.trim();

if(!USERS[u] || USERS[u].pass !== p){

loginBtn.classList.remove("loading");
loginText.innerText="Entrar";

loginError.innerText="Usuário ou senha inválidos";
loginScreen.querySelector(".loginBox")
.classList.add("shake");

setTimeout(()=>{
loginScreen.querySelector(".loginBox")
.classList.remove("shake");
},400);

return;
}

sessionStorage.setItem("role", USERS[u].role);
sessionStorage.setItem("user", u);

loginScreen.style.opacity="0";

setTimeout(()=>{
loginScreen.style.display="none";
applyRole();
loadStoredBase();
},400);

},700);
}

function logout(){
sessionStorage.clear();
location.reload();
}

// ================= ROLE

function applyRole(){
let role=sessionStorage.getItem("role");
let userName=sessionStorage.getItem("user");

upload.style.display = role==="admin"?"block":"none";
userBadge.innerText = userName ? "👤 "+userName : "";
}

// ================= THEME

function toggleTheme(){
dark=!dark;
document.body.classList.toggle("dark");
themeBtn.innerText=dark?"☀️":"🌙";
render();
}

// ================= STORAGE BASE

function loadStoredBase(){
let saved=localStorage.getItem("baseData");
if(saved){
base=JSON.parse(saved);
buildFilter();
render();
}
}

// ================= EXCEL UPLOAD (ADMIN ONLY)

upload.onchange=e=>{

if(sessionStorage.getItem("role")!=="admin"){
alert("Somente admin pode importar");
return;
}

const reader=new FileReader();

reader.onload=evt=>{
const wb=XLSX.read(evt.target.result,{type:'binary'});
base=XLSX.utils.sheet_to_json(
wb.Sheets[wb.SheetNames[0]]
);

localStorage.setItem("baseData",JSON.stringify(base));

buildFilter();
render();
};

reader.readAsBinaryString(e.target.files[0]);
};

// ================= HELPERS

function splitSquad(v){
if(!v) return [];
return v.split(",").map(x=>x.trim());
}

function count(col,data,multi=false){
let m={};
data.forEach(r=>{
let vals=multi?splitSquad(r[col]):[r[col]];
vals.forEach(v=>{
if(!v) return;
m[v]=(m[v]||0)+1;
});
});
return m;
}

// ================= KPI ANIM

function animateNumber(el,final){
let n=0;
let step=Math.ceil(final/30)||1;
let t=setInterval(()=>{
n+=step;
if(n>=final){el.innerText=final;clearInterval(t);}
else el.innerText=n;
},20);
}

// ================= FILTER FX

function animateFilterRefresh(){
document.querySelectorAll(".card,.kpiCard")
.forEach((el,i)=>{
el.classList.add("updating");
setTimeout(()=>el.classList.remove("updating"),300+i*40);
});
}

// ================= FILTER

function buildFilter(){
let s=new Set();
base.forEach(r=>splitSquad(r["Squad/Team"]).forEach(x=>s.add(x)));
squadFilter.innerHTML=
"<option>Todos</option>"+
[...s].map(x=>`<option>${x}</option>`).join("");
}

squadFilter.onchange=()=>{
animateFilterRefresh();
render();
};

// ================= DRAW SORTED

function draw(id,type,map){

const ctx=document.getElementById(id);
if(ctx.chart) ctx.chart.destroy();

let entries=Object.entries(map).sort((a,b)=>b[1]-a[1]);
let labels=entries.map(e=>e[0]);
let values=entries.map(e=>e[1]);
let max=Math.max(...values);

ctx.chart=new Chart(ctx,{
type:type,
data:{
labels,
datasets:[{
data:values,
backgroundColor:values.map(v=>v===max?accent:baseColor),
borderRadius:8
}]
},
options:{
animation:{duration:1000},
plugins:{
legend:{display:false},
datalabels:{
color:"#fff",
font:{weight:"bold"},
formatter:v=>v
}
},
scales:{
x:{grid:{display:false}},
y:{grid:{display:false}}
}
}
});
}

// ================= RENDER

function render(){

if(!base.length) return;

let data=
squadFilter.value==="Todos"
?base
:base.filter(r=>
splitSquad(r["Squad/Team"])
.includes(squadFilter.value)
);

let total=data.length;

let done=data.filter(r=>
(r.Status||"").toLowerCase().includes("concl")
).length;

let bug=data.filter(r=>
(r.Tipo||"").toLowerCase().includes("bug")
).length;

animateNumber(kpiTotal,total);
animateNumber(kpiDone,done);
kpiBug.innerText=Math.round((bug/total)*100||0)+"%";

draw("squadChart","bar",count("Squad/Team",data,true));
draw("statusChart","bar",count("Status",data));
draw("tipoChart","bar",count("Tipo",data));
draw("prioChart","bar",count("Prioridade",data));
}

// ================= AUTO LOAD

window.onload=()=>{
if(sessionStorage.getItem("role")){
loginScreen.style.display="none";
applyRole();
loadStoredBase();
}
}

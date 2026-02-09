Chart.register(ChartDataLabels);

let base=[];
let dark=false;

const strongColors=[
"#ff6b6b",
"#4ecdc4",
"#ffe66d",
"#5f27cd",
"#48dbfb",
"#1dd1a1",
"#ff9f43",
"#ee5253",
"#0abde3",
"#10ac84"
];

function toggleTheme(){
dark=!dark;
document.body.classList.toggle("dark");
document.querySelector(".themeToggle").innerText = dark ? "☀️" : "🌙";
render();
}

upload.onchange=e=>{
const reader=new FileReader();
reader.onload=evt=>{
const wb=XLSX.read(evt.target.result,{type:'binary'});
base=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
buildFilter();
render();
};
reader.readAsBinaryString(e.target.files[0]);
};

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

function draw(id,type,map,legend=false){

const ctx=document.getElementById(id);
if(ctx.chart) ctx.chart.destroy();

let labels=Object.keys(map);
let values=Object.values(map);

let pairs=labels.map((l,i)=>({l,v:values[i]})).sort((a,b)=>b.v-a.v);
labels=pairs.map(x=>x.l);
values=pairs.map(x=>x.v);

ctx.chart=new Chart(ctx,{
type:type==="barh"?"bar":type,
data:{
labels:labels,
datasets:[{
data:values,
backgroundColor:strongColors,
borderWidth:2
}]
},
options:{
indexAxis:type==="barh"?'y':'x',
plugins:{
legend:{
display:legend,
labels:{
color:"#fff",
font:{weight:"bold",size:14}
}
},
tooltip:{
callbacks:{
label:(c)=>" "+Math.round(c.raw)
}
},
datalabels:{
color:"#ffffff",
font:{weight:"bold",size:14},
formatter:(v)=>Math.round(v)
}
},
scales:{
x:{grid:{display:false},ticks:{color:"#fff",font:{weight:"bold"}}},
y:{grid:{display:false},ticks:{color:"#fff",font:{weight:"bold"}}}
}
}
});
}

function buildFilter(){
let s=new Set();
base.forEach(r=>splitSquad(r["Squad/Team"]).forEach(x=>s.add(x)));
squadFilter.innerHTML="<option value='Todos'>Todos</option>"+
[...s].map(x=>`<option>${x}</option>`).join("");
}

squadFilter.onchange=render;

function render(){

let data=squadFilter.value==="Todos"
? base
: base.filter(r=>splitSquad(r["Squad/Team"]).includes(squadFilter.value));

let total=data.length;
kpiTotal.innerText=total;

let done=data.filter(r=>(r.Status||"").toLowerCase().includes("concl")).length;
kpiDone.innerText=Math.round((done/total)*100||0)+"%";

let bug=data.filter(r=>(r.Tipo||"").toLowerCase().includes("bug")).length;
kpiBug.innerText=Math.round((bug/total)*100||0)+"%";

draw("squadChart","bar",count("Squad/Team",data,true),false);
draw("statusChart","barh",count("Status",data),false);
draw("tipoChart","bar",count("Tipo",data),false);
draw("prioChart","bar",count("Prioridade",data),false);

draw("doneChart","pie",{
"Concluídas":done,
"Não concluídas":total-done
},true);

}
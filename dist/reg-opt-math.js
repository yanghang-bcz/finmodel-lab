/* Experiment04 拓展 · 优化理论与方法（课件 4+5 第四节）。
   线性规划（单纯形，含迭代表）、目标规划（加权偏差）、非线性规划（罚函数 + 梯度法）。
   纯计算 + base R 脚本生成，node 与浏览器共用。 */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.RegOptMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({c1:3,c2:2,a11:1,a12:1,b1:4,a21:1,a22:3,b2:6,
  g1:100,g2:140,w1:1,w2:1,xlo:60,xhi:180,
  x0:0,y0:0,rho:10,target:3,steps:20});
function check(p){
  for(const k of ['c1','c2','a11','a12','b1','a21','a22','b2'])if(!Number.isFinite(p[k]))throw Error('线性规划参数须为有限数值。');
  if(!(p.b1>0&&p.b2>0))throw Error('右端项须为正，教学版单纯形从可行基开始。');
  if(!(p.a11>=0&&p.a12>=0&&p.a21>=0&&p.a22>=0))throw Error('教学版要求技术系数非负。');
  if(!(p.g1>0&&p.g2>0))throw Error('目标值必须为正。');
  if(!(p.w1>0&&p.w2>0))throw Error('权重必须为正。');
  if(!(p.xlo<p.xhi))throw Error('决策变量区间须满足下限 < 上限。');
  if(!Number.isInteger(p.steps)||p.steps<1||p.steps>200)throw Error('迭代步数须为 1–200 的整数。');
  return true;
}
/* ---------- 1. 线性规划：max c'x, Ax<=b, x>=0，带迭代轨迹 ---------- */
function lp(p){
  check(p);
  const A=[[p.a11,p.a12],[p.a21,p.a22]],b=[p.b1,p.b2],c=[p.c1,p.c2];
  const m=b.length,n=c.length;
  /* 单纯形表：m 个约束行 + 1 个目标行；列 = x1..xn, s1..sm, rhs */
  const T=[],basis=[];
  for(let i=0;i<m;i++){const row=[...A[i],...Array.from({length:m},(_,j)=>j===i?1:0),b[i]];T.push(row);basis.push(n+i);}
  T.push([...c.map(v=>-v),...Array(m).fill(0),0]);
  const trace=[{iter:0,basis:[...basis],tableau:T.map(r=>r.slice()),z:0}];
  let iter=0,optimum=null;
  while(iter<40){
    const obj=T[m];
    let enter=-1,best=0;
    for(let j=0;j<n+m;j++)if(obj[j]<-1e-12&&obj[j]<best){best=obj[j];enter=j;}
    if(enter<0){optimum=true;break;}
    let leave=-1,ratio=Infinity;
    for(let i=0;i<m;i++)if(T[i][enter]>1e-12){const r=T[i][n+m]/T[i][enter];if(r<ratio-1e-12){ratio=r;leave=i;}}
    if(leave<0){optimum=false;break;}
    const piv=T[leave][enter];
    T[leave]=T[leave].map(v=>v/piv);
    for(let i=0;i<=m;i++)if(i!==leave){const f=T[i][enter];if(Math.abs(f)>1e-12)T[i]=T[i].map((v,j)=>v-f*T[leave][j]);}
    basis[leave]=enter;iter++;
    trace.push({iter,basis:[...basis],tableau:T.map(r=>r.slice()),z:T[m][n+m]});
  }
  const x=Array(n).fill(0);
  basis.forEach((v,i)=>{if(v<n)x[v]=T[i][n+m];});
  const z=c.reduce((s,v,i)=>s+v*x[i],0);
  /* 可行域顶点（用于作图）：两条约束与坐标轴的交点 */
  const corners=[[0,0],[p.b1/p.a11,0],[0,p.b1/p.a12],[p.b2/p.a21,0],[0,p.b2/p.a22]];
  const feasible=corners.filter(([x1,x2])=>x1>=-1e-9&&x2>=-1e-9&&A[0][0]*x1+A[0][1]*x2<=p.b1+1e-9&&A[1][0]*x1+A[1][1]*x2<=p.b2+1e-9)
    .map(([x1,x2])=>({x1,x2,z:c[0]*x1+c[1]*x2}));
  /* 两条约束的交点 */
  const det=A[0][0]*A[1][1]-A[0][1]*A[1][0];
  if(Math.abs(det)>1e-12){
    const x1=(p.b1*A[1][1]-A[0][1]*p.b2)/det,x2=(A[0][0]*p.b2-p.b1*A[1][0])/det;
    if(x1>=-1e-9&&x2>=-1e-9)feasible.push({x1,x2,z:c[0]*x1+c[1]*x2});
  }
  return{trace,x,z,status:optimum?'optimal':'unbounded',iterations:iter,feasible,
    slope:c[0]/-c[1]||0,constraints:A,b,c};
}
/* ---------- 2. 目标规划：加权偏差最小（一维，加权中位数） ---------- */
function gp(p){
  check(p);
  const goals=[{g:p.g1,w:p.w1},{g:p.g2,w:p.w2}];
  /* 一维加权绝对偏差最小 ⇒ 加权中位数；在 [xlo, xhi] 上取候选点求解 */
  let best=null;
  const cands=new Set([p.xlo,p.xhi,p.g1,p.g2]);
  for(let x=p.xlo;x<=p.xhi;x+=1)cands.add(x);
  for(const x of [...cands].sort((a,b)=>a-b)){
    let cost=0;
    for(const g of goals)cost+=g.w*Math.abs(g.g-x);
    if(!best||cost<best.cost-1e-12)best={x,cost};
  }
  const x=best.x;
  const dev=goals.map(g=>({g:g.g,w:g.w,achieved:x,dPlus:Math.max(0,x-g.g),dMinus:Math.max(0,g.g-x)}));
  const total=dev.reduce((s,d)=>s+d.w*(d.dPlus+d.dMinus),0);
  return{x,cost:total,dev,goals,
    curve:Array.from({length:51},(_,i)=>{const v=p.xlo+(p.xhi-p.xlo)*i/50;let c2=0;for(const g of goals)c2+=g.w*Math.abs(g.g-v);return{v,c:c2};})};
}
/* ---------- 3. 非线性规划：min f 罚函数 + 梯度法 ---------- */
function nlp(p){
  check(p);
  const f=(x,y)=>(x-2)**2+(y-1)**2+(p.rho/2)*Math.max(0,p.target-x-y)**2;
  const grad=(x,y)=>{
    const g=Math.max(0,p.target-x-y);
    return[2*(x-2)-p.rho*g,2*(y-1)-p.rho*g];
  };
  let x=p.x0,y=p.y0;const path=[{x,y,f:f(x,y)}];
  const rate=.12;
  for(let i=0;i<p.steps;i++){
    const [gx,gy]=grad(x,y);
    x-=rate*gx;y-=rate*gy;
    path.push({x,y,f:f(x,y),g:Math.hypot(gx,gy)});
  }
  const [gx,gy]=grad(x,y);
  return{path,x,y,f:f(x,y),gradient:Math.hypot(gx,gy),penalty:p.rho,target:p.target,
    constraint:p.target-x-y,
    contour:Array.from({length:13},(_,i)=>Array.from({length:13},(_,j)=>{const px=-1+4*i/12,py=-1+3*j/12;return{px,py,f:f(px,py)};}))};
}
/* ---------- 4. R 脚本 ---------- */
function build(view,p,q,lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,code,explain,formula='')=>blocks.push({key,title,lines:Array.isArray(code)?code:String(code).split('\n'),explain,formula});
  const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
  if(view==='lp'){
    add('data',T('模型与参数','Model and parameters'),
      [T('# max 3x + 2y  s.t.  x + y <= 4, x + 3y <= 6, x,y >= 0','# max 3x + 2y  s.t.  x + y <= 4, x + 3y <= 6, x,y >= 0'),
       `c <- c(${num(p.c1)}, ${num(p.c2)})`,
       `A <- matrix(c(${num(p.a11)}, ${num(p.a12)}, ${num(p.a21)}, ${num(p.a22)}), nrow = 2, byrow = TRUE)`,
       `b <- c(${num(p.b1)}, ${num(p.b2)})`],
      T('两个决策变量、两条约束，正好能画在平面上；添加松弛变量后进入单纯形表。','Two decision variables and two constraints fit on a plane; slack variables turn the model into a simplex tableau.'));
    add('simplex',T('单纯形表迭代','Simplex tableau iterations'),
      [T('# 手工实现：入基取目标行最负系数，出基做最小比值检验','# Implemented by hand: the entering column is the most negative objective coefficient, leaving row by the minimum ratio'),
       'simplex <- function(A, b, c) {',
       '  m <- nrow(A); n <- length(c)',
       '  T <- cbind(A, diag(m), b)',
       '  basis <- n + seq_len(m)',
       '  obj <- c(-c, rep(0, m), 0)',
       '  for (it in seq_len(40)) {',
       '    enter <- which.min(obj[seq_len(n + m)])',
       '    if (obj[enter] >= -1e-12) break',
       '    ratio <- ifelse(T[, enter] > 1e-12, T[, n + m + 1] / T[, enter], Inf)',
       '    leave <- which.min(ratio)',
       '    T[leave, ] <- T[leave, ] / T[leave, enter]',
       '    for (i in seq_len(m)) if (i != leave) T[i, ] <- T[i, ] - T[i, enter] * T[leave, ]',
       '    obj <- obj - obj[enter] * T[leave, ]',
       '    basis[leave] <- enter',
       '    cat("iter", it, "enter", enter, "leave", leave, "z", obj[n + m + 1], "\\n")',
       '  }',
       '  x <- numeric(n); for (i in seq_len(m)) if (basis[i] <= n) x[basis[i]] <- T[i, n + m + 1]',
       '  list(x = x, z = sum(c * x))',
       '}',
       'print(simplex(A, b, c))'],
      T('单纯形沿可行域的顶点移动；每一步都保持可行并让目标不下降。','The simplex moves along vertices of the feasible region, staying feasible while the objective never falls.'),
      String.raw`\max c'x\ \ \text{s.t.}\ Ax\le b,\ x\ge 0`);
    add('check',T('顶点核对','Vertex check'),
      [T('# 枚举约束交点，验证最优解确实落在顶点上','# Enumerate constraint intersections to confirm the optimum is a vertex'),
       'corners <- rbind(c(0,0), c(b[1]/A[1,1], 0), c(0, b[1]/A[1,2]),',
       '  c(b[2]/A[2,1], 0), c(0, b[2]/A[2,2]))',
       'det <- A[1,1]*A[2,2] - A[1,2]*A[2,1]',
       'if (abs(det) > 1e-12) corners <- rbind(corners,',
       '  c((b[1]*A[2,2] - A[1,2]*b[2])/det, (A[1,1]*b[2] - b[1]*A[2,1])/det))',
       'ok <- apply(corners, 1, function(v) all(A %*% v <= b + 1e-9) && all(v >= -1e-9))',
       'print(data.frame(corners[ok, , drop = FALSE], z = corners[ok, , drop = FALSE] %*% c))'],
      T('顶点核对照单纯形是独立算法：两种方法给出同一个最优点才算通过。','Vertex enumeration is an independent check: the two methods must agree on the optimum.'));
  }
  if(view==='gp'){
    add('gp',T('目标规划：加权偏差','Goal programming: weighted deviations'),
      [T('# 两个目标各有目标值与权重；最小化加权偏差和','# Two goals with target values and weights; minimise the weighted deviation'),
       `g <- c(${num(p.g1)}, ${num(p.g2)})`,`w <- c(${num(p.w1)}, ${num(p.w2)})`,
       `lo <- ${num(p.xlo)}; hi <- ${num(p.xhi)}`,
       'cost <- function(x) sum(w * abs(g - x))',
       'grid <- seq(lo, hi, by = 1)',
       'x_star <- grid[which.min(sapply(grid, cost))]',
       'print(data.frame(x = x_star, cost = cost(x_star)))',
       'print(data.frame(goal = g, achieved = x_star, d_plus = pmax(0, x_star - g), d_minus = pmax(0, g - x_star)))'],
      T('目标规划放弃"唯一最优"，改为在多个目标之间找加权折中；权重改变会移动解。','Goal programming gives up a unique optimum and seeks a weighted compromise; changing the weights moves the solution.'),
      String.raw`\min\ \sum_i w_i(d_i^++d_i^-)\ \ \text{s.t.}\ x+d_i^--d_i^+=g_i`);
    add('curve',T('偏差代价曲线','Deviation cost curve'),
      [T('# 画出一维决策变量上的加权偏差，观察折点','# Plot the weighted deviation over the decision variable and find the kink'),
       'plot(grid, sapply(grid, cost), type = "l", xlab = "x", ylab = "weighted deviation",',
       '  main = "Goal-programming cost")',
       'abline(v = x_star, lty = 2)',
       'abline(v = g, lty = 3, col = "grey50")'],
      T('折点通常落在某个目标值上，这就是加权中位数的几何表现。','The kink usually sits at one of the target values, which is the weighted median in geometric form.'));
  }
  if(view==='nlp'){
    add('nlp',T('非线性规划：罚函数 + 梯度法','Nonlinear programming: penalty plus gradient steps'),
      [T('# 目标：min (x−2)² + (y−1)² + (ρ/2)·max(0, 3−x−y)²','# Objective: min (x-2)^2 + (y-1)^2 + (rho/2)*max(0, 3-x-y)^2'),
       `rho <- ${num(p.rho)}; target <- ${num(p.target)}`,
       'f <- function(v) (v[1]-2)^2 + (v[2]-1)^2 + (rho/2)*max(0, target - v[1] - v[2])^2',
       'grad <- function(v) { g <- max(0, target - v[1] - v[2])',
       '  c(2*(v[1]-2) - rho*g, 2*(v[2]-1) - rho*g) }',
       `v <- c(${num(p.x0)}, ${num(p.y0)}); path <- v`,
       `for (i in seq_len(${p.steps})) { step <- grad(v); v <- v - 0.12*step; path <- rbind(path, v) }`,
       'print(v); print(f(v)); print(target - v[1] - v[2])'],
      T('罚函数把约束"软化"为目标的一部分；ρ 越大越接近硬约束，但数值上更难优化。','The penalty softens the constraint into the objective; a larger rho approaches a hard constraint but is numerically harder.'),
      String.raw`\min f(x)+\frac{\rho}{2}\left[\max(0,g(x))\right]^2`);
    add('path',T('迭代路径','Iteration path'),
      [T('# 画出收敛路径与最终梯度范数','# Plot the path and the final gradient norm'),
       'plot(path[,1], path[,2], type = "b", xlab = "x", ylab = "y", main = "Gradient descent path")',
       'abline(a = target, b = -1, lty = 2)',
       'cat("final gradient norm:", sqrt(sum(grad(v)^2)), "\\n")'],
      T('虚线是约束边界；最终点越接近边界，说明罚项越强。','The dashed line is the constraint boundary; the closer the final point, the stronger the penalty.'));
  }
  return{blocks,code:'# FinModel Lab | Experiment 04.4 | optimization\n\n'+blocks.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{defaults,check,lp,gp,nlp,build};
});

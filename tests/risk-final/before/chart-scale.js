/* Viewport ranges only; the financial model remains in FinMath. */
(function(root){
'use strict';
function range(points){const xs=points.map(q=>q.sd),ys=points.map(q=>q.mean),lo=Math.min(...xs),hi=Math.max(...xs),bottom=Math.min(...ys),top=Math.max(...ys),xpad=hi===0?.01:Math.max((hi-lo)*.1,hi*.025),ypad=Math.max((top-bottom)*.14,.005);return{xmin:Math.max(0,lo-xpad),xmax:hi+xpad,ymin:bottom-ypad,ymax:top+ypad};}
function union(a,b){return a?{xmin:Math.min(a.xmin,b.xmin),xmax:Math.max(a.xmax,b.xmax),ymin:Math.min(a.ymin,b.ymin),ymax:Math.max(a.ymax,b.ymax)}:{...b};}
function contains(a,points){return points.every(q=>q.sd>=a.xmin&&q.sd<=a.xmax&&q.mean>=a.ymin&&q.mean<=a.ymax);}
root.FinScale={range,union,contains};if(typeof module!=='undefined')module.exports=root.FinScale;
})(typeof window!=='undefined'?window:globalThis);

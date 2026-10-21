# 基础 R，可整段复制到 RStudio；网页不执行 R
# sigma 与 raw Vega 使用小数单位；两方法均无隐藏回退
S <- 102.5509506650269; K <- 80.04114173352718; T <- 1.7123538936022669; r <- -0.021352388407103722; q <- 0.001096861611586064
type <- "C"; target <- 78.1501536745285; tol <- 1e-8
max_iter <- 200; initial <- 0.6559368848800659
bs <- function(sigma) {
  A <- S*exp(-q*T); D <- K*exp(-r*T)
  if (T == 0 || sigma == 0) return(c(price=if(type=="C") max(A-D,0) else max(D-A,0), vega=0))
  d1 <- (log(S/K)+(r-q+sigma^2/2)*T)/(sigma*sqrt(T))
  d2 <- d1-sigma*sqrt(T)
  price <- if(type=="C") max(0,A-D,A*pnorm(d1)-D*pnorm(d2)) else max(0,D-A,D*pnorm(-d2)-A*pnorm(-d1))
  c(price=price, vega=A*dnorm(d1)*sqrt(T))
}
solve_iv <- function(method) {
  rows <- data.frame(); expansions <- 0; lower <- NA; upper <- NA
  finish <- function(status, sigma=NA_real_, error=NA_real_) list(status=status,sigma=sigma,error=error,rows=rows,expansions=expansions)
  if(any(!is.finite(c(S,K,T,r,q))) || S<.01 || S>1e5 || K<.01 || K>1e5 || T<0 || T>10 || r < -0.1 || r>.3 || q<0 || q>1) return(finish("invalid_parameters"))
  if(!(type %in% c("C","P")) || !(method %in% c("bisection","newton")) || any(!is.finite(c(target,tol,max_iter,initial))) || target<0 || tol<1e-12 || tol>.01 || max_iter<1 || max_iter>200 || max_iter!=floor(max_iter) || initial<=0 || initial>1e6) return(finish("invalid_settings"))
  if(T==0) return(finish("expiry_nonunique"))
  lower <- unname(bs(0)["price"]); upper <- if(type=="C") S*exp(-q*T) else K*exp(-r*T)
  if(target<lower || target>upper) return(finish("arbitrage_bounds"))
  if(target==lower) return(finish("zero_boundary",0,0))
  if(target==upper) return(finish("infinite_limit"))
  if(min(target-lower,upper-target)<=32*.Machine$double.eps*max(1,upper)) return(finish("precision_limit"))
  a <- 0; b <- .25
  if(method=="bisection") {
    while(bs(b)["price"]<target && b<1e6 && expansions<24) { b <- min(1e6,b*2); expansions <- expansions+1 }
    if(bs(b)["price"]<target) return(finish("bracket_limit"))
  }
  sigma <- initial
  for(i in seq_len(max_iter)) {
    if(method=="bisection") sigma <- a+(b-a)/2
    value <- bs(sigma); price <- unname(value["price"])
    error <- price-target; vega <- unname(value["vega"])
    next_sigma <- if(method=="newton" && vega>0) sigma-error/vega else NA_real_
    next_a <- if(abs(error)<=tol) a else if(error<0) sigma else a; next_b <- if(abs(error)<=tol) b else if(error<0) b else sigma
    rows <- rbind(rows,data.frame(sigma=sigma,price=price,error=error,vega=vega,next_sigma=next_sigma,a=if(method=="bisection") a else NA_real_,b=if(method=="bisection") b else NA_real_,next_a=if(method=="bisection") next_a else NA_real_,next_b=if(method=="bisection") next_b else NA_real_,stop=""))
    status <- ""
    if(abs(error)<=tol) status <- "converged"
    else if(method=="newton") {
      if(vega<1e-12) status <- "low_vega"
      else if(!is.finite(next_sigma) || next_sigma<=0 || next_sigma>1e6) status <- "newton_out_of_range"
      else if(next_sigma==sigma) status <- "precision_limit"
    } else if(sigma==a || sigma==b) status <- "precision_limit"
    if(status!="") { rows$stop[nrow(rows)] <- status; return(finish(status,sigma,error)) }
    if(method=="newton") sigma <- next_sigma else { a <- next_a; b <- next_b }
  }
  rows$stop[nrow(rows)] <- "max_iterations"
  finish("max_iterations",tail(rows$sigma,1),tail(rows$error,1))
}
bisection <- function() solve_iv("bisection")
newton <- function() solve_iv("newton")
results <- list(bisection=bisection(),newton=newton())
for(method in names(results)) {
  cat("\n",method,"\n"); print(results[[method]][c("status","sigma","error","expansions")])
  print(results[[method]]$rows, digits=12)
}
# 工程实践可用 uniroot；上面保留每一步教学轨迹。

for (m in names(results)) {
 x <- results[[m]]; cat("RESULT",m,x$status,sprintf("%.17g",x$sigma),sprintf("%.17g",x$error),x$expansions,"\n")
 if(nrow(x$rows)) write.table(x$rows,file=paste0("tests/bs-round2/case-29-",m,".csv"),sep=",",row.names=FALSE,quote=FALSE,na="NA")
}

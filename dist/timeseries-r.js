/* Base R implementations. Each section is included verbatim in copied scripts. */
(function(root, factory) {
  const api = factory();
  if (typeof module === "object") module.exports = api;
  else root.TimeSeriesR = api;
})(this, () => {
  const source = {
    station: `# ADF: H0 is a unit root. The tau test has its own critical values.
adf <- function(y, type, lag) {
  d <- diff(y)
  t <- seq.int(lag + 1L, length(d))
  X <- matrix(y[t], ncol = 1)
  if (type != "none") X <- cbind(X, 1)
  if (type == "trend") X <- cbind(X, t)
  for (j in seq_len(lag)) X <- cbind(X, d[t - j])
  fit <- lm.fit(X, d[t])
  stopifnot(fit$rank == ncol(X), fit$df.residual > 0)
  vc <- chol2inv(qr.R(fit$qr)) * sum(fit$residuals^2) / fit$df.residual
  tau <- fit$coefficients[1] / sqrt(vc[which(fit$qr$pivot == 1), which(fit$qr$pivot == 1)])
  critical <- switch(type, none = rep(-1.95, 5),
    drift = c(-2.93, -2.89, -2.88, -2.87, -2.86),
    trend = c(-3.50, -3.45, -3.43, -3.42, -3.41))
  critical <- critical[1 + sum(length(d) >= c(50, 100, 250, 500))]
  c(tau = unname(tau), critical = critical, reject = unname(tau < critical))
}

# KPSS: H0 is level/trend stationarity. Bartlett/Newey-West long-run variance.
kpss <- function(y, trend) {
  n <- length(y)
  e <- if (trend) residuals(lm(y ~ seq_along(y))) else y - mean(y)
  bw <- floor(4 * (n / 100)^0.25)
  lrv <- sum(e^2) / n
  for (j in seq_len(bw)) {
    lrv <- lrv + 2 * (1 - j / (bw + 1)) * sum(e[(j + 1):n] * e[1:(n-j)]) / n
  }
  statistic <- sum(cumsum(e)^2) / (n^2 * lrv)
  critical <- if (trend) .146 else .463
  c(statistic = statistic, critical = critical, bandwidth = bw, reject = statistic > critical)
}`,
    arma: `# Reflection coefficients with absolute values below one constrain AR and MA.
reflection <- function(z) {
  a <- numeric()
  for (v in z) {
    k <- .995 * tanh(v)
    a <- c(a - k * rev(a), k)
  }
  a
}
arma_residuals <- function(y, mu, ar, ma, burn = 5L) {
  e <- numeric(length(y))
  for (t in seq.int(burn + 1L, length(y))) {
    v <- y[t] - mu
    for (j in seq_along(ar)) v <- v - ar[j] * (y[t-j] - mu)
    for (j in seq_along(ma)) if (t-j > burn) v <- v - ma[j] * e[t-j]
    e[t] <- v
  }
  e
}
# Conditional Gaussian likelihood with the first five innovations initialized at zero.
fit_arma <- function(y, p, q) {
  burn <- 5L
  n <- length(y) - burn
  stopifnot(length(y) >= max(30, burn + 5 * (p + q + 2)))
  m <- mean(y)
  s <- sqrt(mean((y-m)^2))
  stopifnot(s > 1e-12 * max(1, abs(m)))
  z <- (y-m)/s
  ar_id <- seq_len(p)
  ma_id <- p + seq_len(q)
  profile <- function(w) {
    ar <- reflection(w[ar_id]); ma <- -reflection(w[ma_id])
    e <- arma_residuals(z,0,ar,ma,burn)
    # The residual is affine in the mean. Filter its sensitivity with the same MA recursion.
    sensitivity <- numeric(length(z))
    constant <- 1-sum(ar)
    for (t in seq.int(burn+1L,length(z))) {
      v <- constant
      for (j in seq_along(ma)) if (t-j>burn) v <- v-ma[j]*sensitivity[t-j]
      sensitivity[t] <- v
    }
    center <- sum(e*sensitivity)/sum(sensitivity^2)
    list(ar=ar,ma=ma,center=center,value=sum((e-center*sensitivity)^2)/n)
  }
  w <- rep(0,p+q)
  if (p==1L && q==0L) {
    lagged <- z[burn:(length(z)-1L)]
    response <- z[(burn+1L):length(z)]
    # For AR(1), use the exact least-squares slope within the stationarity bound.
    slope <- sum((lagged-mean(lagged))*(response-mean(response)))/sum((lagged-mean(lagged))^2)
    w <- atanh(max(-1+1e-12,min(1-1e-12,slope/.995)))
  } else if (length(w)) {
    second <- w
    second[1] <- .4
    loss <- function(x) profile(x)$value
    attempts <- lapply(list(w,second), function(x) optim(x, loss, method="BFGS",
      control=list(maxit=600, reltol=1e-13, ndeps=rep(1e-5, length(x)))))
    good <- Filter(function(x) x$convergence == 0 && is.finite(x$value), attempts)
    if (!length(good)) stop("ARMA optimization failed")
    w <- good[[which.min(vapply(good, function(x) x$value, numeric(1)))]]$par
  }
  best <- profile(w)
  stopifnot(is.finite(best$value),best$value>1e-14)
  ar <- best$ar; ma <- best$ma; mu <- m+s*best$center
  variance <- best$value*s^2
  logLik <- -n/2 * (log(2*pi*variance)+1)
  k <- p+q+2
  AIC <- -2*logLik+2*k
  list(p=p, q=q, mu=mu, ar=ar, ma=ma, burn=burn, sigma2=variance, logLik=logLik,
    residual=arma_residuals(y,mu,ar,ma,burn), IC=c(AIC=AIC,
      AICc=AIC+2*k*(k+1)/(n-k-1), BIC=-2*logLik+log(n)*k))
}
# Score each candidate on the same effective n, including the variance parameter.
choose_arma <- function(y, mode, criterion, p, q, grid=FALSE) {
  if (mode=="manual" && !grid) return(list(fit=fit_arma(y,p,q)))
  orders <- expand.grid(q=0:3, p=0:3)
  fits <- lapply(seq_len(nrow(orders)), function(i)
    tryCatch(fit_arma(y, orders$p[i], orders$q[i]), error=function(e) NULL))
  scores <- t(vapply(fits, function(f) if (is.null(f)) setNames(rep(NA_real_,3),c("AIC","AICc","BIC")) else f$IC, numeric(3)))
  colnames(scores) <- c("AIC","AICc","BIC")
  fit <- if (mode=="auto") fits[[which.min(scores[,criterion])]] else fit_arma(y,p,q)
  list(fit=fit, candidates=cbind(orders,scores))
}
arma_next <- function(y, e, t, fit) {
  fit$mu + sum(fit$ar*(y[t-seq_along(fit$ar)]-fit$mu)) +
    sum(fit$ma*e[t-seq_along(fit$ma)])
}
# Recursive point forecasts and innovation-only 80% / 95% intervals.
arma_forecast <- function(y, fit, horizon) {
  e <- fit$residual
  pred <- numeric(horizon)
  psi <- c(1, rep(0, horizon-1))
  for (h in seq_len(horizon)) {
    pred[h] <- arma_next(y, e, length(y)+1L, fit)
    y <- c(y,pred[h]); e <- c(e,0)
    if (h>1) {
      j <- seq_len(min(h-1,length(fit$ar)))
      psi[h] <- sum(fit$ar[j]*psi[h-j]) + if (h-1<=length(fit$ma)) fit$ma[h-1] else 0
    }
  }
  se <- sqrt(fit$sigma2*cumsum(psi^2))
  cbind(value=pred, lo80=pred-qnorm(.9)*se, hi80=pred+qnorm(.9)*se,
    lo95=pred-qnorm(.975)*se, hi95=pred+qnorm(.975)*se)
}`,
    var: `# y[t] = c + A1 y[t-1] + ... + Ap y[t-p] + u[t], estimated by equation-wise OLS.
var_design <- function(Y,t,p) c(1, as.vector(t(Y[t-seq_len(p),,drop=FALSE])))
fit_var <- function(Y,p,start=p) {
  m <- ncol(Y); n <- nrow(Y)-start
  k <- 1+m*p
  stopifnot(m>=2, n>=max(30,3*k))
  ts <- seq.int(start+1,nrow(Y))
  X <- t(vapply(ts, function(t) var_design(Y,t,p), numeric(k)))
  fit <- lm.fit(X,Y[ts,,drop=FALSE])
  stopifnot(fit$rank==k)
  U <- fit$residuals
  Sigma <- crossprod(U)/n
  ld <- 2*sum(log(diag(chol(Sigma))))
  IC <- ld + c(AIC=2, BIC=log(n), HQ=2*log(log(n)))*m*k/n
  list(p=p,m=m,start=start,X=X,coef=fit$coefficients,df=fit$df.residual,
    residual=U,fitted=fit$fitted.values,cov=Sigma,IC=IC)
}
# Compare candidates using identical target dates, then refit the selected order.
choose_var <- function(Y, mode, criterion, p, grid=FALSE) {
  if (mode=="manual" && !grid) return(list(fit=fit_var(Y,p)))
  scores <- t(vapply(1:5, function(j) tryCatch(fit_var(Y,j,5)$IC,
    error=function(e) rep(NA_real_,3)), numeric(3)))
  colnames(scores) <- c("AIC","BIC","HQ")
  if (mode=="auto") p <- which.min(scores[,criterion])
  list(fit=fit_var(Y,p),candidates=cbind(p=1:5,scores))
}
var_roots <- function(fit) {
  m <- fit$m
  d <- m*fit$p
  A <- t(fit$coef[-1,,drop=FALSE])
  if (d>m) A <- rbind(A, cbind(diag(d-m),matrix(0,d-m,m)))
  eigen(A,only.values=TRUE)$values
}
# Conditional direction-specific F test. H0: all p coefficients are zero.
granger <- function(Y, fit, from, to) {
  X <- fit$X; p <- fit$p; m <- fit$m
  restricted <- X[,-(1L+from+(0:(p-1L))*m),drop=FALSE]
  e0 <- lm.fit(restricted,Y[(fit$start+1):nrow(Y),to])$residuals
  rss <- sum(fit$residual[,to]^2)
  F <- max(0,(sum(e0^2)-rss)/p)/(rss/fit$df)
  c(F=F,df1=p,df2=fit$df,p=pf(F,p,fit$df,lower.tail=FALSE))
}
var_next <- function(Y,t,fit) drop(var_design(Y,t,fit$p) %*% fit$coef)
var_forecast <- function(Y,fit,horizon) {
  n <- nrow(Y)
  for (h in seq_len(horizon)) Y <- rbind(Y,var_next(Y,nrow(Y)+1L,fit))
  Y[n+seq_len(horizon),,drop=FALSE]
}`,
    lstm: `# Frozen LSTM inference. Gate order: input, forget, output, candidate.
lstm_next <- function(Y,t,model) {
  H <- model$hidden; D <- length(model$features)
  W <- matrix(model$weights[seq_len(4*H*(D+H+1))], nrow=4*H, byrow=TRUE)
  readout <- tail(model$weights,H+1)
  h <- memory <- numeric(H)
  J <- seq_len(H)
  for (k in seq.int(t-model$window,t-1L)) {
    x <- (Y[k,model$features]-model$center[seq_len(D)])/model$scale[seq_len(D)]
    gates <- drop(W %*% c(1,x,h))
    memory <- plogis(gates[H+J])*memory + plogis(gates[J])*tanh(gates[3*H+J])
    h <- plogis(gates[2*H+J])*tanh(memory)
  }
  model$center[D+1L] + model$scale[D+1L]*sum(readout*c(1,h))
}`
  };
  const quoted = s => JSON.stringify(s);
  const vector = (values, f = String) => 'c(' + values.map(f).join(', ') + ')';
  function wrapped(values, f = String) {
    const lines = [];
    for (let i = 0; i < values.length; i += 6) lines.push('  ' + values.slice(i,i+6).map(f).join(', '));
    return 'c(\n' + lines.join(',\n') + '\n)';
  }
  const list = entries => 'list(' + Object.entries(entries).map(([k,v])=>k+'='+v).join(', ') + ')';
  function lstmModelCode(model) {
    return list({hidden:model.hidden,window:model.window,features:vector(model.features.map(j=>j+1)),
      center:vector(model.center),scale:vector(model.scale),weights:wrapped(model.weights)});
  }
  function build(view, data, options, model, available) {
    const o = options, blocks = [];
    const add = (id, title, text, code) => blocks.push({id,title,text,code:code.trim()});
    add('data','数据 / Data','网页与 R 使用同一份已确认数据和日期。价格转换是相邻观察的 Pₜ/Pₜ₋₁ − 1 或 log(Pₜ) − log(Pₜ₋₁)。',
      '# FinModel Lab | Experiment 05 | Base R, no extra packages.\n' +
      '# ' + (data.synthetic ? 'Synthetic financial series; t labels are simulated periods.' : 'Browser-confirmed aligned data; no external files required.') +
      '\nlabels <- ' + vector(data.names,quoted) + '\ndates <- ' + wrapped(data.dates,quoted) +
      '\nraw <- matrix(' + wrapped(data.rows.flat()) + ', ncol=length(labels), byrow=TRUE)\n' +
      'colnames(raw) <- labels\nY <- raw\n' +
      (data.kind === 'price' && o.form === 'simple' ? 'Y <- raw[-1,,drop=FALSE]/raw[-nrow(raw),,drop=FALSE]-1\ndates <- dates[-1]\n' : '') +
      (data.kind === 'price' && o.form === 'log' ? 'Y <- log(raw[-1,,drop=FALSE])-log(raw[-nrow(raw),,drop=FALSE])\ndates <- dates[-1]\n' : '') +
      'target <- ' + (o.target+1) + 'L\ny <- Y[,target]\n' +
      'series_labels <- paste("Series", seq_along(labels))\nprint(setNames(labels,series_labels))\n' +
      'if (nzchar(Sys.getenv("FINMODEL_R_PLOT"))) pdf(Sys.getenv("FINMODEL_R_PLOT"))');
    const opts = 'arma_mode <- '+quoted(o.armaMode)+'\narma_ic <- '+quoted(o.armaIC)+'\np <- '+o.p+'L\nq <- '+o.q+'L\n';
    const varOpts = 'var_mode <- '+quoted(o.varMode)+'\nvar_ic <- '+quoted(o.varIC)+'\nlag <- '+o.varLag+'L\ncolumns <- '+vector(o.vars.map(i=>i+1))+'\n';
    if (view === 'station') {
      const [adf,kpss] = source.station.split('\n\n# KPSS');
      add('adf','ADF τ','将 Δyₜ 回归于 yₜ₋₁、可选确定性项及滞后差分。检验单位根时比较 τ 与专用左尾临界值。',adf);
      add('kpss','KPSS','水平或趋势平稳是原假设。去除确定性部分后，使用 Bartlett 权重估计长期方差，统计量超过右尾临界值时拒绝。','# KPSS'+kpss);
      add('acf','ACF / PACF','ACF 比较序列和其滞后值。PACF 控制中间滞后；白噪声点态参考线约为 ±1.96/√n。',
        'adf_result <- adf(y, '+quoted(o.adf)+' , '+o.adfLag+'L)\nkpss_result <- kpss(y, '+(o.kpss==='trend'?'TRUE':'FALSE')+
        ')\nprint(adf_result)\nprint(kpss_result)\ncorrelation <- acf(y, lag.max=24, plot=FALSE)\npartial <- pacf(y, lag.max=24, plot=FALSE)\nplot(y,type="l",xlab="Observation",ylab=series_labels[target]); acf(y); pacf(y)');
    }
    if (view === 'arma' || view === 'compare') {
      const [estimation, rest] = source.arma.split('\n# Score each');
      const [selection, forecast] = rest.split('\narma_next');
      add('arma','ARMA 估计 / Fit','p 个 AR 系数作用于过去的 y−μ，q 个 MA 系数作用于过去创新。对给定 AR/MA 系数解析求 μ，再用 BFGS 优化条件平方损失。反射系数约束平稳与可逆。',estimation);
      add('order','ARMA 定阶 / Order','条件对数似然使用同一有效样本。AIC、AICc 与 BIC 对复杂度的惩罚不同。','# Score each'+selection);
      add('forecast','ARMA 预测 / Forecast','递推时未来创新期望为零，区间方差为 σ²Σψ²。区间基于高斯创新，条件于参数估计。','arma_next'+forecast);
    }
    if (view === 'var' || view === 'compare') {
      const [estimation,rest] = source.var.split('\nvar_roots');
      const [roots,rest2] = rest.split('\n# Conditional direction');
      const [granger,forecast] = rest2.split('\nvar_next');
      add('var','VAR 估计与定阶 / Fit','各方程共享含截距的滞后设计。自动定阶在相同日期用 log det(Σ̂) 与复杂度惩罚比较，随后用所选阶数重估。',estimation);
      add('roots','VAR 稳定性 / Roots','伴随矩阵特征值模全部小于 1 时，估计的 VAR 满足稳定性条件。','var_roots'+roots);
      add('granger','Granger 联合检验 / F test','检验给定其他变量的滞后后，来源变量的全部 p 个滞后系数是否为零。经典 F 参考分布需要相应误差假设。','# Conditional direction'+granger);
      add('joint','VAR 联合预测 / Forecast','逐期把系统所有变量的点预测作为下一期滞后输入。','var_next'+forecast);
    }
    if (view === 'arma') add('result','诊断与图表 / Results','Ljung–Box 使用有效残差，参考自由度为 L−p−q。未拒绝表示证据不足以判定所选滞后仍有线性相关。',
      opts+'out <- choose_arma(y, arma_mode, arma_ic, p, q, '+(o.chart==='criteria'?'TRUE':'FALSE')+
      ')\nf <- out$fit\nprint(out$candidates)\nprint(c(mu=f$mu,f$ar,f$ma,variance=f$sigma2,logLik=f$logLik,f$IC))\n'+
      'e <- tail(f$residual,-f$burn)\nL <- '+o.diagnostic+'L\nif (L>f$p+f$q && L<length(e)) print(Box.test(e,lag=L,type="Ljung-Box",fitdf=f$p+f$q))\n'+
      'forecast <- arma_forecast(y,f,'+o.horizon+'L)\nprint(forecast)\n'+
      'plot(e/sqrt(f$sigma2),type="l",ylab="Standardized residual"); acf(e)\n'+
      'plot(seq_along(y),y,type="l",xlim=c(max(1,length(y)-75),length(y)+nrow(forecast)),\n'+
      '  ylim=range(tail(y,75),forecast),xlab="Observation / forecast period",ylab=series_labels[target])\n'+
      'h <- length(y)+seq_len(nrow(forecast)); abline(v=length(y),lty=3)\n'+
      'matlines(h,forecast,type="l",lty=c(1,2,2,3,3),col=c(1,2,2,4,4)); points(h,forecast[,"value"])');
    if (view === 'var') add('result','联合预测与检验 / Results','所有方向使用相同的模型和同期样本。F 检验反映条件预测增量，现实因果需要额外识别假设。',
      varOpts+'V <- Y[,columns,drop=FALSE]\nout <- choose_var(V,var_mode,var_ic,lag,'+(o.chart==='criteria'?'TRUE':'FALSE')+')\nf <- out$fit\n'+
      'print(out$candidates); print(f$coef); print(f$cov)\nroots <- var_roots(f)\nprint(roots); print(max(Mod(roots))<1)\n'+
      'for (i in seq_len(ncol(V))) for (j in setdiff(seq_len(ncol(V)),i)) {\n'+
      '  cat(colnames(V)[i],"->",colnames(V)[j],"\\n"); print(granger(V,f,i,j))\n}\n'+
      'forecast <- var_forecast(V,f,'+o.horizon+'L)\nprint(forecast)\n'+
      'matplot(seq_len(nrow(forecast)),forecast,type="b",pch=1,xlab="Future period",ylab="Forecast");\n'+
      'legend("topright",legend=series_labels[columns],col=seq_len(ncol(V)),lty=seq_len(ncol(V)),bty="n")');
    if (view === 'compare') {
      add('split','时间划分 / Split','训练区决定 ARMA/VAR 参数及 LSTM 标准化。LSTM 用随后验证区早停。逐期测试只使用目标日前已观察到的数据。',
        opts+varOpts+'nt <- floor(nrow(Y)*'+o.train+'+1e-10)\nnv <- floor(nrow(Y)*('+o.train+'+'+o.valid+')+1e-10)\n'+
        'stopifnot(nt>=30,nv-nt>=5,nrow(Y)-nv>=5)\ntrain <- seq_len(nt)\ntest <- seq.int(nv+1,nrow(Y))\n'+
        'actual <- y[test]\npredictions <- list(Naive=y[test-1])\n'+
        'safe_model <- function(expr) tryCatch(expr,error=function(e) { message(conditionMessage(e)); NULL })\n'+
        (available?.ARMA?.error ? '# Browser ARMA unavailable.\n' :
          'a <- safe_model(choose_arma(y[train],arma_mode,arma_ic,p,q)$fit)\n'+
          'if (!is.null(a)) {\n  e <- arma_residuals(y,a$mu,a$ar,a$ma,a$burn)\n'+
          '  predictions$ARMA <- vapply(test,function(t) arma_next(y,e,t,a),numeric(1))\n}\n')+
        (available?.VAR?.error ? '# Browser VAR unavailable.\n' :
          'if (length(columns)>=2 && target %in% columns) {\n  V <- Y[,columns,drop=FALSE]\n'+
          '  v <- safe_model(choose_var(V[train,,drop=FALSE],var_mode,var_ic,lag)$fit)\n'+
          '  if (!is.null(v)) predictions$VAR <- vapply(test,function(t) var_next(V,t,v)[match(target,columns)],numeric(1))\n}'));
      if (model) {
        add('lstm','LSTM 推断 / Inference','每个窗口以零隐藏状态开始。输入门、遗忘门、输出门和候选状态更新记忆。R 用训练验证后冻结的权重，输出再恢复目标尺度。',
          '# Adam; seed '+model.seed+'; batch '+model.batch+'; rate '+model.rate+'; max epochs '+model.epochs+
          '; stopped '+model.curve.length+'; restored '+model.bestEpoch+'.\n'+source.lstm+'\nmodel <- '+lstmModelCode(model)+
          '\npredictions$LSTM <- vapply(test,function(t) lstm_next(Y,t,model),numeric(1))');
      }
      add('scores','共同测试集 / Scores','所有参与模型在同一组日期上预测同一目标的一期值。RMSE 强调大误差，MAE 计算绝对误差的平均。',
        (model ? '' : '# LSTM weights unavailable for these settings. Train on the browser to include LSTM.\n')+
        'stopifnot(all(vapply(predictions,function(z) length(z)==length(actual) && all(is.finite(z)),logical(1))))\n'+
        'scores <- vapply(predictions,function(z) c(RMSE=sqrt(mean((actual-z)^2)),MAE=mean(abs(actual-z))),numeric(2))\n'+
        'print(scores)\nprint(head(data.frame(date=dates[test],actual=actual,as.data.frame(predictions))))\n'+
        'barplot(scores["RMSE",],ylab="One-step test RMSE")\n'+
        'matplot(cbind(actual,do.call(cbind,predictions)),type="l",xlab="Test observation",ylab=series_labels[target])');
    }
    if (view === 'lstm' && model) {
      add('lstm','LSTM 推断 / Inference','使用冻结权重还原共同测试日期的一期预测。',
        '# Adam; seed '+model.seed+'; batch '+model.batch+'; rate '+model.rate+'; max epochs '+model.epochs+
        '; stopped '+model.curve.length+'; restored '+model.bestEpoch+'.\n'+source.lstm+'\nmodel <- '+lstmModelCode(model)+
        '\ntest <- seq.int('+ (model.nv+1) +'L,nrow(Y))\nactual <- y[test]\n'+
        'prediction <- vapply(test,function(t) lstm_next(Y,t,model),numeric(1))\n'+
        'print(c(RMSE=sqrt(mean((actual-prediction)^2)),MAE=mean(abs(actual-prediction))))\n'+
        'print(head(data.frame(date=dates[test],actual,prediction)))\n'+
        'matplot(cbind(actual,prediction),type="l",xlab="Test observation",ylab=series_labels[target])\n'+
        'legend("topright",c("Actual","LSTM"),col=1:2,lty=1:2,bty="n")');
    }
    return {blocks, script:blocks.map(b=>b.code).join('\n\n')+'\n'};
  }
  return {build, source};
});

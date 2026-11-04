/* Train on a dedicated worker. The main thread terminates it on cancel or data change. */
'use strict';
self.onmessage = ({data}) => {
  try {
    const url = name => name + '?v=' + encodeURIComponent(data.hashes[name].slice(0,16));
    importScripts(...['capm-math.js','reg-math.js','timeseries-math.js','timeseries-lstm.js'].map(url));
    const model = TimeSeriesLSTM.training(data.rows,data.options,entry=>postMessage({entry}));
    postMessage({model});
  } catch (error) {
    postMessage({error:error.message});
  }
};

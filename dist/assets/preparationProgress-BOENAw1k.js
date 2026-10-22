import{d as c}from"./renderApp-LHt78e4W.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=c("ExternalLink",[["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}],["polyline",{points:"15 3 21 3 21 9",key:"mznyad"}],["line",{x1:"10",x2:"21",y1:"14",y2:"3",key:"18c3s4"}]]);function m(n,i,r){const t=n.attempts.filter(e=>e.step_index===i),l=new Set(t.map(e=>e.interview_id)),s=r.filter(e=>l.has(e.interview_id)).sort((e,o)=>new Date(o.created_at).getTime()-new Date(e.created_at).getTime()),a=s.length?Math.max(...s.map(e=>e.overall_score)):null;return{attempts:t,results:s,best:a,passed:a!==null&&a>80,active:t.find(e=>e.status==="scheduled"||e.status==="in_progress")}}export{p as E,m as s};

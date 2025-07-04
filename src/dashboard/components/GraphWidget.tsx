// import React from "react";
// import { useExtensionData } from "../../data/useExtensionData";

// const GraphWidget: React.FC = () => {
//     const { isLoading, error } = useExtensionData();

//     const openGraph = () => {
//         chrome.tabs.create({
//             url: chrome.runtime.getURL("src/graph/graph.html"),
//         });
//     };

//     if (isLoading) {
//         return (
//             <div className="card">
//                 <div
//                     style={{
//                         fontFamily: "Nunito-Regular, Arial, sans-serif",
//                         fontSize: "14px",
//                         color: "#666",
//                         textAlign: "center",
//                     }}
//                 >
//                     Loading graph...
//                 </div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="card">
//                 <div
//                     style={{
//                         fontFamily: "Nunito-Regular, Arial, sans-serif",
//                         fontSize: "14px",
//                         color: "#d63031",
//                         textAlign: "center",
//                     }}
//                 >
//                     Error loading graph: {error}
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <>
//             <style>{`
//                 .card {
//                     width: 320px;
//                     height: 200px;
//                     background-color: #ffffff;
//                     border-radius: 24px;
//                     border: 2px solid #333;
//                     box-shadow: 6px 6px 0px #d1d1d1;
//                     position: relative;
//                     padding: 32px;
//                     box-sizing: border-box;
//                     cursor: pointer;
//                     transition: transform 0.2s ease;
//                 }

//                 .card:hover {
//                     transform: translate(-2px, -2px);
//                     box-shadow: 8px 8px 0px #d1d1d1;
//                 }

//                 .dots-container {
//                     position: absolute;
//                     top: 24px;
//                     right: 24px;
//                     width: 140px;
//                     height: 80px;
//                 }

//                 .dot {
//                     position: absolute;
//                     width: 32px;
//                     height: 32px;
//                     border-radius: 50%;
//                     border: 3px solid #333;
//                 }

//                 .dot-red {
//                     background-color: #e74c3c;
//                 }

//                 .dot-purple {
//                     background-color: #b19cd9;
//                 }

//                 .dot:nth-child(1) {
//                     top: 8px;
//                     left: 20px;
//                 }

//                 .dot:nth-child(2) {
//                     top: 8px;
//                     right: 20px;
//                 }

//                 .dot:nth-child(3) {
//                     bottom: 8px;
//                     left: 8px;
//                 }

//                 .dot:nth-child(4) {
//                     bottom: 8px;
//                     right: 8px;
//                 }

//                 .text-container {
//                     position: absolute;
//                     bottom: 32px;
//                     left: 32px;
//                 }

//                 .main-text {
//                     font-size: 24px;
//                     font-weight: 700;
//                     color: #333;
//                     margin: 0 0 8px 0;
//                     line-height: 1.2;
//                     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//                 }

//                 .sub-text {
//                     font-size: 14px;
//                     color: #666;
//                     margin: 0;
//                     line-height: 1.3;
//                     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//                 }
//             `}</style>
//             <div className="card" onClick={openGraph}>
//                 <div className="dots-container">
//                     <div className="dot dot-red"></div>
//                     <div className="dot dot-purple"></div>
//                     <div className="dot dot-purple"></div>
//                     <div className="dot dot-red"></div>
//                 </div>

//                 <div className="text-container">
//                     <h2 className="main-text">Connect the dots</h2>
//                     <p className="sub-text">see how you ended up on a site</p>
//                 </div>
//             </div>
//         </>
//     );
// };

// export default GraphWidget;

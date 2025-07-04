// import React, { useState, useEffect } from "react";
// import ChannelCard from "./ChannelCard";
// import {
//     useExtensionData,
//     getChannelData,
//     getChannelUrlCounts,
// } from "../../data/useExtensionData";

// interface ChannelConfig {
//     name: string;
//     domain: string;
//     defaultKey: string; // Maps to original channel data keys
// }

// const DEFAULT_CHANNELS: ChannelConfig[] = [
//     { name: "Outlook", domain: "outlook.com", defaultKey: "outlook" },
//     { name: "YouTube", domain: "youtube.com", defaultKey: "youtube" },
//     { name: "ChatGPT", domain: "chat.openai.com", defaultKey: "chatgpt" },
//     { name: "Gmail", domain: "gmail.com", defaultKey: "gmail" },
// ];

// const STORAGE_KEY = "custom_channels";

// const Channel: React.FC = () => {
//     const { currentSession, isLoading, error } = useExtensionData();
//     const [isEditing, setIsEditing] = useState(false);
//     const [channels, setChannels] = useState<ChannelConfig[]>(DEFAULT_CHANNELS);
//     const [editChannels, setEditChannels] =
//         useState<ChannelConfig[]>(DEFAULT_CHANNELS);

//     // Load custom channels from localStorage
//     useEffect(() => {
//         const loadChannels = () => {
//             try {
//                 const stored = localStorage.getItem(STORAGE_KEY);
//                 if (stored) {
//                     const parsedChannels = JSON.parse(stored);
//                     setChannels(parsedChannels);
//                     setEditChannels(parsedChannels);
//                 }
//             } catch (error) {
//                 console.error("Error loading channels:", error);
//             }
//         };
//         loadChannels();
//     }, []);

//     const saveChannels = () => {
//         try {
//             localStorage.setItem(STORAGE_KEY, JSON.stringify(editChannels));
//             setChannels(editChannels);
//             setIsEditing(false);
//         } catch (error) {
//             console.error("Error saving channels:", error);
//         }
//     };

//     const cancelEdit = () => {
//         setEditChannels(channels);
//         setIsEditing(false);
//     };

//     const updateChannel = (
//         index: number,
//         field: keyof ChannelConfig,
//         value: string,
//     ) => {
//         const updated = [...editChannels];
//         updated[index][field] = value;
//         setEditChannels(updated);
//     };

//     // Get data for custom domains
//     const getCustomChannelData = (channel: ChannelConfig) => {
//         if (!currentSession) return { time: "0s", urlCount: 0, icon: "" };
//         // Always calculate data based on current domain, even if it was originally a default
//         const allVisits = currentSession.tabSessions.flatMap(
//             (ts) => ts.urlVisits,
//         );
//         let totalTime = 0;
//         let urlCount = 0;
//         allVisits.forEach((visit) => {
//             const visitDomain = visit.domain.toLowerCase();
//             const targetDomain = channel.domain
//                 .toLowerCase()
//                 .replace("www.", "");
//             // More flexible domain matching
//             if (
//                 visitDomain.includes(targetDomain) ||
//                 visitDomain.includes(targetDomain.split(".")[0]) || // Match main part (youtube from youtube.com)
//                 (targetDomain.includes("gmail") &&
//                     visitDomain.includes("mail.google")) ||
//                 (targetDomain.includes("outlook") &&
//                     (visitDomain.includes("outlook") ||
//                         visitDomain.includes("office.com"))) ||
//                 (targetDomain.includes("chat.openai") &&
//                     visitDomain.includes("openai"))
//             ) {
//                 totalTime += visit.activeTime;
//                 urlCount++;
//             }
//         });
//         const formatTime = (ms: number): string => {
//             const seconds = Math.floor(ms / 1000);
//             const minutes = Math.floor(seconds / 60);
//             const hours = Math.floor(minutes / 60);
//             if (hours > 0) {
//                 const decimalHours = (minutes / 60).toFixed(1);
//                 return `${decimalHours}h`;
//             } else if (minutes > 0) {
//                 return `${minutes}m`;
//             } else {
//                 return `${seconds}s`;
//             }
//         };
//         return {
//             time: formatTime(totalTime),
//             urlCount: urlCount,
//             icon: `https://www.google.com/s2/favicons?domain=${channel.domain}&sz=32`,
//         };
//     };

//     if (isLoading) {
//         return (
//             <div style={{ margin: "20px 24px", width: "auto" }}>
//                 <div
//                     style={{
//                         fontFamily: "system-ui, -apple-system, sans-serif",
//                         fontSize: "14px",
//                         color: "rgba(255, 255, 255, 0.7)",
//                         padding: "20px 0",
//                     }}
//                 >
//                     Loading channel data...
//                 </div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div style={{ margin: "10px 24px", width: "auto" }}>
//                 <div
//                     style={{
//                         fontFamily: "system-ui, -apple-system, sans-serif",
//                         fontSize: "14px",
//                         color: "#ff6b47",
//                         padding: "20px 0",
//                     }}
//                 >
//                     Error loading channel data: {error}
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div
//             style={{
//                 width: "auto",
//                 background: "rgba(0, 0, 0, 0.3)",
//                 borderRadius: "24px",
//                 padding: "30px 30px",
//                 backdropFilter: "blur(10px)",
//                 border: "1px solid rgba(255, 255, 255, 0.1)",
//                 position: "relative",
//                 marginTop: "-35px",
//             }}
//         >
//             {/* Edit Button */}
//             {!isEditing && (
//                 <button
//                     onClick={() => setIsEditing(true)}
//                     style={{
//                         position: "absolute",
//                         top: "0px",
//                         right: "0px",
//                         padding: "8px",
//                         background: "transparent",
//                         border: "none",
//                         cursor: "pointer",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         borderRadius: "6px",
//                         transition: "all 0.2s ease",
//                     }}
//                     onMouseEnter={(e) => {
//                         e.currentTarget.style.background =
//                             "rgba(255, 255, 255, 0.1)";
//                     }}
//                     onMouseLeave={(e) => {
//                         e.currentTarget.style.background = "transparent";
//                     }}
//                 >
//                     <svg
//                         width="16"
//                         height="16"
//                         viewBox="0 0 24 24"
//                         fill="none"
//                         stroke="rgba(255, 255, 255, 0.7)"
//                         strokeWidth="2"
//                     >
//                         <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
//                     </svg>
//                 </button>
//             )}
//             <div
//                 style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "20px",
//                 }}
//             >
//                 {/* Top - Title and Description */}
//                 <div>
//                     <h2
//                         style={{
//                             fontFamily: "system-ui, -apple-system, sans-serif",
//                             fontSize: "24px",
//                             fontWeight: "400",
//                             color: "rgba(255, 255, 255, 0.9)",
//                             margin: "0",
//                             marginBottom: "8px",
//                         }}
//                     >
//                         Channels
//                     </h2>
//                     {/* Edit Controls */}
//                     {isEditing && (
//                         <div
//                             style={{
//                                 marginTop: "20px",
//                                 display: "flex",
//                                 gap: "8px",
//                             }}
//                         >
//                             <button
//                                 onClick={saveChannels}
//                                 style={{
//                                     padding: "6px 12px",
//                                     background: "#4285f4",
//                                     color: "white",
//                                     border: "none",
//                                     borderRadius: "6px",
//                                     fontFamily:
//                                         "system-ui, -apple-system, sans-serif",
//                                     fontSize: "12px",
//                                     cursor: "pointer",
//                                     transition: "all 0.2s ease",
//                                 }}
//                                 onMouseEnter={(e) => {
//                                     e.currentTarget.style.background =
//                                         "#3367d6";
//                                 }}
//                                 onMouseLeave={(e) => {
//                                     e.currentTarget.style.background =
//                                         "#4285f4";
//                                 }}
//                             >
//                                 Save
//                             </button>
//                             <button
//                                 onClick={cancelEdit}
//                                 style={{
//                                     padding: "6px 12px",
//                                     background: "transparent",
//                                     color: "rgba(255, 255, 255, 0.7)",
//                                     border: "1px solid rgba(255, 255, 255, 0.2)",
//                                     borderRadius: "6px",
//                                     fontFamily:
//                                         "system-ui, -apple-system, sans-serif",
//                                     fontSize: "12px",
//                                     cursor: "pointer",
//                                     transition: "all 0.2s ease",
//                                 }}
//                                 onMouseEnter={(e) => {
//                                     e.currentTarget.style.background =
//                                         "rgba(255, 255, 255, 0.1)";
//                                 }}
//                                 onMouseLeave={(e) => {
//                                     e.currentTarget.style.background =
//                                         "transparent";
//                                 }}
//                             >
//                                 Cancel
//                             </button>
//                         </div>
//                     )}
//                 </div>
//                 {/* Bottom - Channel Cards (Vertical) */}
//                 <div
//                     style={{
//                         display: "flex",
//                         flexDirection: "column",
//                         gap: "16px",
//                         alignItems: "center",
//                         width: "100%",
//                     }}
//                 >
//                     {(isEditing ? editChannels : channels).map(
//                         (channel, index) => {
//                             const data = getCustomChannelData(channel);
//                             if (isEditing) {
//                                 return (
//                                     <div
//                                         key={index}
//                                         style={{
//                                             background: "#000000",
//                                             borderRadius: "12px",
//                                             padding: "16px",
//                                             display: "flex",
//                                             alignItems: "center",
//                                             gap: "12px",
//                                             width: "100%",
//                                             maxWidth: "400px",
//                                             border: "1px solid rgba(255, 255, 255, 0.1)",
//                                         }}
//                                     >
//                                         <input
//                                             type="text"
//                                             value={channel.name}
//                                             onChange={(e) =>
//                                                 updateChannel(
//                                                     index,
//                                                     "name",
//                                                     e.target.value,
//                                                 )
//                                             }
//                                             style={{
//                                                 flex: "1",
//                                                 padding: "8px 12px",
//                                                 background:
//                                                     "rgba(255, 255, 255, 0.1)",
//                                                 border: "1px solid rgba(255, 255, 255, 0.2)",
//                                                 borderRadius: "6px",
//                                                 fontFamily:
//                                                     "system-ui, -apple-system, sans-serif",
//                                                 fontSize: "14px",
//                                                 color: "white",
//                                                 outline: "none",
//                                             }}
//                                             placeholder="Name"
//                                         />
//                                         <input
//                                             type="text"
//                                             value={channel.domain}
//                                             onChange={(e) =>
//                                                 updateChannel(
//                                                     index,
//                                                     "domain",
//                                                     e.target.value,
//                                                 )
//                                             }
//                                             style={{
//                                                 flex: "1",
//                                                 padding: "8px 12px",
//                                                 background:
//                                                     "rgba(255, 255, 255, 0.1)",
//                                                 border: "1px solid rgba(255, 255, 255, 0.2)",
//                                                 borderRadius: "6px",
//                                                 fontFamily:
//                                                     "system-ui, -apple-system, sans-serif",
//                                                 fontSize: "14px",
//                                                 color: "white",
//                                                 outline: "none",
//                                             }}
//                                             placeholder="domain.com"
//                                         />
//                                     </div>
//                                 );
//                             }
//                             return (
//                                 <div
//                                     key={channel.domain}
//                                     style={{ width: "100%", maxWidth: "400px" }}
//                                 >
//                                     <ChannelCard
//                                         icon={data.icon}
//                                         domain={channel.name}
//                                         urlCount={data.urlCount}
//                                         timeSpent={data.time}
//                                     />
//                                 </div>
//                             );
//                         },
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Channel;

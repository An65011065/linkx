// import React, { useState } from "react";
// import { useExtensionData } from "../../data/useExtensionData";
// import type { TabSession } from "../../data/dataService";
// import type { UrlVisit } from "../../shared/types/browsing.types";

// interface DomainData {
//     domain: string;
//     visits: number;
//     totalTime: number;
//     duration: number;
// }

// type SortOption = "activeTime" | "visits";

// const DestinationItem: React.FC<{
//     destination: DomainData;
//     formatTime: (ms: number) => string;
// }> = ({ destination, formatTime }) => (
//     <div
//         style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             padding: "12px 16px",
//             backgroundColor: "#f8f9fa",
//             borderRadius: "1px",
//             marginBottom: "-10px",
//         }}
//     >
//         <div style={{ flex: 1 }}>
//             <div
//                 style={{
//                     fontFamily: "Nunito-Bold, Arial, sans-serif",
//                     fontSize: "14px",
//                     color: "#2d3436",
//                     marginBottom: "1px",
//                 }}
//             >
//                 {destination.domain}
//             </div>
//             <div
//                 style={{
//                     fontFamily: "Nunito-Regular, Arial, sans-serif",
//                     fontSize: "12px",
//                     color: "#636e72",
//                 }}
//             >
//                 {destination.visits} visits
//             </div>
//         </div>
//         <div
//             style={{
//                 fontFamily: "Nunito-Bold, Arial, sans-serif",
//                 fontSize: "14px",
//                 color: "#2d3436",
//                 marginLeft: "16px",
//             }}
//         >
//             {formatTime(destination.totalTime)}
//         </div>
//     </div>
// );

// const Modal: React.FC<{
//     isOpen: boolean;
//     onClose: () => void;
//     children: React.ReactNode;
// }> = ({ isOpen, onClose, children }) => {
//     if (!isOpen) return null;

//     return (
//         <div
//             style={{
//                 position: "fixed",
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 bottom: 0,
//                 backgroundColor: "rgba(0, 0, 0, 0.5)",
//                 backdropFilter: "blur(5px)",
//                 display: "flex",
//                 justifyContent: "center",
//                 alignItems: "center",
//                 zIndex: 1000,
//             }}
//             onClick={onClose}
//         >
//             <div
//                 style={{
//                     backgroundColor: "white",
//                     padding: "32px",
//                     borderRadius: "16px",
//                     maxWidth: "600px",
//                     width: "90%",
//                     maxHeight: "80vh",
//                     overflowY: "auto",
//                     position: "relative",
//                 }}
//                 onClick={(e) => e.stopPropagation()}
//             >
//                 <button
//                     style={{
//                         position: "absolute",
//                         top: "16px",
//                         right: "16px",
//                         background: "none",
//                         border: "none",
//                         fontSize: "24px",
//                         cursor: "pointer",
//                         color: "#666",
//                     }}
//                     onClick={onClose}
//                 >
//                     ×
//                 </button>
//                 {children}
//             </div>
//         </div>
//     );
// };

// const DigitalDestinations: React.FC = () => {
//     const { currentSession } = useExtensionData();
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [sortOption, setSortOption] = useState<SortOption>("activeTime");
//     const [isSearchOpen, setIsSearchOpen] = useState(false);
//     const [searchQuery, setSearchQuery] = useState("");

//     // Calculate top destinations from currentSession
//     const getTopDestinations = (): DomainData[] => {
//         if (!currentSession) {
//             return [];
//         }

//         const domainMap = new Map<string, DomainData>();

//         currentSession.tabSessions.forEach((tabSession: TabSession) => {
//             tabSession.urlVisits.forEach((visit: UrlVisit) => {
//                 const domain = visit.domain;
//                 const existing = domainMap.get(domain);

//                 if (existing) {
//                     existing.visits += 1;
//                     existing.totalTime += visit.activeTime || 0;
//                     existing.duration += visit.duration || 0;
//                 } else {
//                     domainMap.set(domain, {
//                         domain,
//                         visits: 1,
//                         totalTime: visit.activeTime || 0,
//                         duration: visit.duration || 0,
//                     });
//                 }
//             });
//         });

//         let destinations = Array.from(domainMap.values());

//         // Apply search filter if query exists
//         if (searchQuery) {
//             destinations = destinations.filter((d) =>
//                 d.domain.toLowerCase().includes(searchQuery.toLowerCase()),
//             );
//         }

//         // Apply sorting
//         destinations.sort((a, b) => {
//             switch (sortOption) {
//                 case "activeTime":
//                     return b.totalTime - a.totalTime;
//                 case "visits":
//                     return b.visits - a.visits;
//                 default:
//                     return b.totalTime - a.totalTime;
//             }
//         });

//         return destinations.slice(0, 8);
//     };

//     const formatTime = (milliseconds: number): string => {
//         const minutes = Math.floor(milliseconds / (1000 * 60));
//         if (minutes < 60) {
//             return `${minutes}m`;
//         }
//         const hours = Math.floor(minutes / 60);
//         const remainingMinutes = minutes % 60;
//         return `${hours}h ${remainingMinutes}m`;
//     };

//     const topDestinations = getTopDestinations();

//     return (
//         <div
//             style={{
//                 marginTop: "32px",
//                 marginBottom: "32px",
//                 width: "calc(50% - 48px)",
//                 minWidth: "400px",
//             }}
//         >
//             <div
//                 style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     marginBottom: "24px",
//                 }}
//             >
//                 <h2
//                     style={{
//                         fontFamily: "Nunito-Bold, Arial, sans-serif",
//                         fontSize: "24px",
//                         color: "#2d3436",
//                         margin: 0,
//                     }}
//                 >
//                     Your Digital Destinations
//                 </h2>
//                 <div style={{ display: "flex", gap: "12px" }}>
//                     {/* Sort Button */}
//                     <button
//                         onClick={() => {
//                             const options: SortOption[] = [
//                                 "activeTime",
//                                 "visits",
//                             ];
//                             const currentIndex = options.indexOf(sortOption);
//                             const nextIndex =
//                                 (currentIndex + 1) % options.length;
//                             setSortOption(options[nextIndex]);
//                         }}
//                         style={{
//                             background: "none",
//                             border: "1px solid #ddd",
//                             borderRadius: "8px",
//                             padding: "8px 12px",
//                             cursor: "pointer",
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "4px",
//                             fontSize: "14px",
//                             fontFamily: "Nunito-Regular, Arial, sans-serif",
//                         }}
//                         title="Sort by"
//                     >
//                         ↕{" "}
//                         {sortOption === "activeTime" ? "Active Time" : "Visits"}
//                     </button>

//                     {/* Search Button */}
//                     <button
//                         onClick={() => setIsSearchOpen(!isSearchOpen)}
//                         style={{
//                             background: isSearchOpen ? "#f0f0f0" : "none",
//                             border: "1px solid #ddd",
//                             borderRadius: "8px",
//                             padding: "8px 12px",
//                             cursor: "pointer",
//                             fontSize: "14px",
//                         }}
//                         title="Search"
//                     >
//                         🔍
//                     </button>

//                     {/* View All Button */}
//                     <button
//                         onClick={() => setIsModalOpen(true)}
//                         style={{
//                             background: "none",
//                             border: "1px solid #ddd",
//                             borderRadius: "8px",
//                             padding: "8px 12px",
//                             cursor: "pointer",
//                             fontSize: "14px",
//                         }}
//                         title="View all"
//                     >
//                         ⤢
//                     </button>
//                 </div>
//             </div>

//             {/* Search Bar */}
//             {isSearchOpen && (
//                 <div style={{ marginBottom: "16px" }}>
//                     <input
//                         type="text"
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                         placeholder="Search domains..."
//                         style={{
//                             width: "100%",
//                             padding: "12px",
//                             borderRadius: "8px",
//                             border: "1px solid #ddd",
//                             fontSize: "14px",
//                             fontFamily: "Nunito-Regular, Arial, sans-serif",
//                         }}
//                     />
//                 </div>
//             )}

//             <div
//                 style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "1px",
//                 }}
//             >
//                 {topDestinations
//                     .slice(0, isSearchOpen ? 3 : 4)
//                     .map((destination) => (
//                         <DestinationItem
//                             key={destination.domain}
//                             destination={destination}
//                             formatTime={formatTime}
//                         />
//                     ))}
//             </div>

//             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
//                 <h2
//                     style={{
//                         fontFamily: "Nunito-Bold, Arial, sans-serif",
//                         fontSize: "24px",
//                         color: "#2d3436",
//                         marginBottom: "24px",
//                     }}
//                 >
//                     Your Digital Destinations
//                 </h2>
//                 <div
//                     style={{
//                         display: "flex",
//                         flexDirection: "column",
//                         gap: "1px",
//                     }}
//                 >
//                     {topDestinations.map((destination) => (
//                         <DestinationItem
//                             key={destination.domain}
//                             destination={destination}
//                             formatTime={formatTime}
//                         />
//                     ))}
//                 </div>
//             </Modal>
//         </div>
//     );
// };

// export default DigitalDestinations;

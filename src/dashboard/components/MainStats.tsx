// import React from "react";
// import { useExtensionData } from "../../data/useExtensionData";

// interface CleanCardProps {
//     title: string;
//     mainValue: React.ReactNode;
//     subtitle: string;
//     dotColors?: string[];
//     width?: number;
//     height?: number;
// }

// const CleanCard: React.FC<CleanCardProps> = ({
//     title,
//     mainValue,
//     subtitle,
//     dotColors = ["#e74c3c", "#9b59b6", "#9b59b6", "#e74c3c"],
//     width = 200,
//     height = 100,
// }) => {
//     return (
//         <div
//             style={{
//                 width: `${width}px`,
//                 height: `${height}px`,
//                 backgroundColor: "#ffffff",
//                 borderRadius: "16px",
//                 border: "2px solid #2c3e50",
//                 position: "relative",
//                 padding: "16px", // Reduced padding for smaller cards
//                 display: "flex",
//                 flexDirection: "column",
//                 justifyContent: "space-between",
//                 boxShadow: "4px 4px 0px rgba(44, 62, 80, 0.1)",
//             }}
//         >
//             {/* Decorative dots in upper right */}
//             <div
//                 style={{
//                     position: "absolute",
//                     top: "12px",
//                     right: "12px",
//                     display: "grid",
//                     gridTemplateColumns: "1fr 1fr",
//                     gap: "4px", // Reduced gap
//                 }}
//             >
//                 {dotColors.map((color, index) => (
//                     <div
//                         key={index}
//                         style={{
//                             width: "10px", // Reduced from 20px to 10px
//                             height: "10px", // Reduced from 20px to 10px
//                             borderRadius: "50%",
//                             backgroundColor: color,
//                             border: "1px solid #2c3e50", // Reduced border width
//                         }}
//                     />
//                 ))}
//             </div>

//             {/* Content */}
//             <div style={{ maxWidth: "70%", flex: 1 }}>
//                 <h3
//                     style={{
//                         fontFamily: "Nunito-Bold, Arial, sans-serif",
//                         fontSize: "14px", // Reduced from 24px
//                         fontWeight: "800",
//                         margin: "0 0 4px 0",
//                         color: "#2c3e50",
//                         lineHeight: "1.2",
//                     }}
//                 >
//                     {title}
//                 </h3>
//                 <p
//                     style={{
//                         fontFamily: "Nunito-Regular, Arial, sans-serif",
//                         fontSize: "10px", // Reduced from 14px
//                         color: "#7f8c8d",
//                         margin: "0",
//                         lineHeight: "1.3",
//                     }}
//                 >
//                     {subtitle}
//                 </p>
//             </div>

//             {/* Main Value - positioned bottom right */}
//             <div
//                 style={{
//                     display: "flex",
//                     justifyContent: "flex-end",
//                     alignItems: "flex-end",
//                 }}
//             >
//                 <div
//                     style={{
//                         fontFamily: "Nunito-Bold, Arial, sans-serif",
//                         fontSize: "20px", // Reduced from 48px
//                         fontWeight: "900",
//                         color: "#2c3e50",
//                         lineHeight: "1",
//                         wordBreak: "break-word",
//                         textAlign: "right",
//                     }}
//                 >
//                     {mainValue}
//                 </div>
//             </div>
//         </div>
//     );
// };

// const MainStats: React.FC = () => {
//     const { currentSession, isLoading, error } = useExtensionData();

//     if (isLoading) {
//         return (
//             <div
//                 style={{
//                     display: "grid",
//                     gridTemplateColumns: "1fr 1fr",
//                     gap: "20px",
//                     marginTop: "20px",
//                     paddingLeft: "0px",
//                 }}
//             >
//                 {[1, 2, 3, 4].map((i) => (
//                     <div
//                         key={i}
//                         style={{
//                             width: "200px",
//                             height: "100px",
//                             backgroundColor: "#f8f9fa",
//                             borderRadius: "16px",
//                             border: "2px solid #e9ecef",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             fontFamily: "Nunito-Regular, Arial, sans-serif",
//                             fontSize: "12px",
//                             color: "#6c757d",
//                         }}
//                     >
//                         Loading...
//                     </div>
//                 ))}
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div
//                 style={{
//                     fontFamily: "Nunito-Regular, Arial, sans-serif",
//                     color: "#dc3545",
//                     fontSize: "14px",
//                     marginTop: "20px",
//                     padding: "20px",
//                     backgroundColor: "#f8d7da",
//                     borderRadius: "8px",
//                     border: "1px solid #f5c6cb",
//                 }}
//             >
//                 Error loading stats: {error}
//             </div>
//         );
//     }

//     if (!currentSession) {
//         return (
//             <div
//                 style={{
//                     fontFamily: "Nunito-Regular, Arial, sans-serif",
//                     color: "#6c757d",
//                     fontSize: "14px",
//                     marginTop: "20px",
//                     padding: "20px",
//                     backgroundColor: "#f8f9fa",
//                     borderRadius: "8px",
//                     border: "1px solid #e9ecef",
//                 }}
//             >
//                 No session data available
//             </div>
//         );
//     }

//     // Extract data from current session structure
//     const stats = currentSession.stats;

//     // Calculate productive vs leisure time
//     const productiveTime = stats.workTime + stats.otherTime;
//     const leisureTime = stats.socialTime;
//     const totalTime = productiveTime + leisureTime;

//     const productivePercentage =
//         totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;

//     // Format time in hours and minutes
//     const formatTime = (milliseconds: number) => {
//         const hours = Math.floor(milliseconds / (1000 * 60 * 60));
//         const minutes = Math.floor(
//             (milliseconds % (1000 * 60 * 60)) / (1000 * 60),
//         );

//         if (hours > 0) {
//             return `${hours}h ${minutes}m`;
//         } else {
//             return `${minutes}m`;
//         }
//     };

//     // Calculate Longest Focus Streaks
//     const calculateFocusStreaks = () => {
//         // Get all visits sorted by time
//         const allVisits = currentSession.tabSessions
//             .flatMap((tab) => tab.urlVisits)
//             .sort((a, b) => a.startTime - b.startTime);

//         if (allVisits.length === 0) {
//             return { domain: "", time: 0, type: "none" };
//         }

//         let longestProductiveStreak = 0;
//         let longestLeisureStreak = 0;
//         let longestProductiveDomain = "";
//         let longestLeisureDomain = "";
//         let currentProductiveStreak = 0;
//         let currentLeisureStreak = 0;
//         let currentProductiveDomain = "";
//         let currentLeisureDomain = "";
//         let lastProductiveDomain = "";
//         let lastLeisureDomain = "";
//         let lastVisitTime = 0;

//         const maxGapTime = 5 * 60 * 1000; // 5 minutes max gap between visits

//         allVisits.forEach((visit) => {
//             const isProductive =
//                 visit.category === "work" || visit.category === "other";
//             const isLeisure = visit.category === "social";
//             const timeSinceLastVisit = visit.startTime - lastVisitTime;

//             if (isProductive) {
//                 if (
//                     visit.domain === lastProductiveDomain &&
//                     timeSinceLastVisit <= maxGapTime
//                 ) {
//                     // Continue streak
//                     currentProductiveStreak += visit.activeTime;
//                 } else {
//                     // Check if current streak is longest
//                     if (currentProductiveStreak > longestProductiveStreak) {
//                         longestProductiveStreak = currentProductiveStreak;
//                         longestProductiveDomain = currentProductiveDomain;
//                     }
//                     // Start new streak
//                     currentProductiveStreak = visit.activeTime;
//                     currentProductiveDomain = visit.domain;
//                     lastProductiveDomain = visit.domain;
//                 }
//             }

//             if (isLeisure) {
//                 if (
//                     visit.domain === lastLeisureDomain &&
//                     timeSinceLastVisit <= maxGapTime
//                 ) {
//                     // Continue streak
//                     currentLeisureStreak += visit.activeTime;
//                 } else {
//                     // Check if current streak is longest
//                     if (currentLeisureStreak > longestLeisureStreak) {
//                         longestLeisureStreak = currentLeisureStreak;
//                         longestLeisureDomain = currentLeisureDomain;
//                     }
//                     // Start new streak
//                     currentLeisureStreak = visit.activeTime;
//                     currentLeisureDomain = visit.domain;
//                     lastLeisureDomain = visit.domain;
//                 }
//             }

//             lastVisitTime = visit.endTime || visit.startTime;
//         });

//         // Don't forget to check final streaks
//         if (currentProductiveStreak > longestProductiveStreak) {
//             longestProductiveStreak = currentProductiveStreak;
//             longestProductiveDomain = currentProductiveDomain;
//         }
//         if (currentLeisureStreak > longestLeisureStreak) {
//             longestLeisureStreak = currentLeisureStreak;
//             longestLeisureDomain = currentLeisureDomain;
//         }

//         // Return the overall longest streak
//         if (
//             longestProductiveStreak >= longestLeisureStreak &&
//             longestProductiveStreak > 0
//         ) {
//             return {
//                 domain: longestProductiveDomain,
//                 time: longestProductiveStreak,
//                 type: "productive",
//             };
//         } else if (longestLeisureStreak > 0) {
//             return {
//                 domain: longestLeisureDomain,
//                 time: longestLeisureStreak,
//                 type: "leisure",
//             };
//         } else {
//             return { domain: "", time: 0, type: "none" };
//         }
//     };

//     // Calculate Site of the Day (most time spent on "other" category domains)
//     const calculateSiteOfTheDay = () => {
//         const domainTimes: { [domain: string]: number } = {};

//         currentSession.tabSessions.forEach((tab) => {
//             tab.urlVisits.forEach((visit) => {
//                 if (visit.category === "other") {
//                     domainTimes[visit.domain] =
//                         (domainTimes[visit.domain] || 0) + visit.activeTime;
//                 }
//             });
//         });

//         let topDomain = "";
//         let topTime = 0;

//         Object.entries(domainTimes).forEach(([domain, time]) => {
//             if (time > topTime) {
//                 topTime = time;
//                 topDomain = domain;
//             }
//         });

//         return { domain: topDomain, time: topTime };
//     };

//     // Format domain name for display
//     const formatDomainName = (domain: string): string => {
//         if (!domain || domain.trim() === "") return "None";

//         // Remove www. and common prefixes
//         const formatted = domain.replace(/^(www\.|m\.|mobile\.)/, "");

//         // Get the main part before the first dot
//         const parts = formatted.split(".");
//         const mainPart = parts[0];

//         // Capitalize first letter
//         const capitalized =
//             mainPart.charAt(0).toUpperCase() + mainPart.slice(1);

//         // Truncate to 8 characters if longer
//         return capitalized.length > 8 ? capitalized.slice(0, 8) : capitalized;
//     };

//     const focusStreaks = calculateFocusStreaks();
//     const siteOfTheDay = calculateSiteOfTheDay();

//     return (
//         <>
//             <style>{`
//                 @font-face {
//                     font-family: 'Nunito-Regular';
//                     src: url('${chrome.runtime.getURL(
//                         "src/assets/fonts/Nunito-Regular.ttf",
//                     )}') format('truetype');
//                     font-weight: 400;
//                     font-style: normal;
//                 }
//                 @font-face {
//                     font-family: 'Nunito-Bold';
//                     src: url('${chrome.runtime.getURL(
//                         "src/assets/fonts/Nunito-Bold.ttf",
//                     )}') format('truetype');
//                     font-weight: 700;
//                     font-style: normal;
//                 }
//             `}</style>

//             <div
//                 style={{
//                     display: "grid",
//                     gridTemplateColumns: "1fr 3fr",
//                     gap: "10px",
//                     marginTop: "20px",
//                     paddingLeft: "0px",
//                 }}
//             >
//                 <CleanCard
//                     title="Total time spent"
//                     subtitle={`across ${stats.totalUrls} links visited today`}
//                     mainValue={formatTime(stats.totalTime)}
//                     dotColors={["#e74c3c", "#3498db", "#3498db", "#e74c3c"]}
//                 />

//                 <CleanCard
//                     title="Productive vs leisure"
//                     subtitle={`${formatTime(
//                         productiveTime,
//                     )} productive, ${formatTime(leisureTime)} leisure`}
//                     mainValue={`${productivePercentage}%`}
//                     dotColors={["#27ae60", "#e74c3c", "#e74c3c", "#27ae60"]}
//                 />

//                 <CleanCard
//                     title="Longest focus streak"
//                     subtitle={
//                         focusStreaks.time > 0
//                             ? `${formatTime(
//                                   focusStreaks.time,
//                               )} on ${formatDomainName(focusStreaks.domain)}`
//                             : "No focus streaks today"
//                     }
//                     mainValue={
//                         focusStreaks.time > 0 && focusStreaks.domain ? (
//                             <img
//                                 src={`https://www.google.com/s2/favicons?domain=${focusStreaks.domain}&sz=32`}
//                                 alt={focusStreaks.domain}
//                                 style={{
//                                     width: "32px",
//                                     height: "32px",
//                                     borderRadius: "4px",
//                                 }}
//                                 onError={(e) => {
//                                     (
//                                         e.target as HTMLImageElement
//                                     ).style.display = "none";
//                                 }}
//                             />
//                         ) : (
//                             "None"
//                         )
//                     }
//                     dotColors={["#f39c12", "#8e44ad", "#8e44ad", "#f39c12"]}
//                 />

//                 <CleanCard
//                     title="Site of the day"
//                     subtitle={
//                         siteOfTheDay.domain
//                             ? `${formatTime(siteOfTheDay.time)} spent exploring`
//                             : "No exploration sites today"
//                     }
//                     mainValue={formatDomainName(siteOfTheDay.domain)}
//                     dotColors={["#f39c12", "#27ae60", "#27ae60", "#f39c12"]}
//                 />
//             </div>
//         </>
//     );
// };

// export default MainStats;

import React from 'react';
const MainMap = React.lazy(() => import("./main-map"));

function ContentView() {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            {/* <MainMap /> */}
        </div>
    );
}

export default ContentView;
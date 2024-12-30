import React from 'react';
const MainMap = React.lazy(() => import("./main-map"));

function ContentView() {
    return (
        <div>
            <MainMap />
        </div>
    );
}

export default ContentView;
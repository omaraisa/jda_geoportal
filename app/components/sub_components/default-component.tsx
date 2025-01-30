import React from "react";

const DefaultComponent: React.FC = () => {
  return (
    <div className="h-full flex justify-center items-center text-white">
      {/* <h4>لا توجد أدوات مفعلة حالياً</h4> */}
      <h4>No tools are currently activated</h4>
    </div>
  );
};

export default DefaultComponent;

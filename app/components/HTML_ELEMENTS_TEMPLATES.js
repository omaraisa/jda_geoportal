export default function HTML_ELEMENTS_TEMPLATES() {
  return (
    <div className="h-full flex justify-center items-center  text-white">
    

      <div className="flex flex-col justify-center items-center space-y-4 text-white">
        <button className="btn btn-primary">Primary Button</button>
        <button className="btn btn-secondary">Secondary Button</button>
        <button className="btn btn-green">Green Button</button>
        <button className="btn btn-danger">Danger Button</button>

        <input type="checkbox" id="switch" className="switch-input" />
        <label htmlFor="switch" className="switch-lable">
          Toggle
        </label>

        <input type="checkbox" className="checkbox" id="_checkbox"></input>
        <label className="tick-label" htmlFor="_checkbox">
          <div id="tick_mark"></div>
        </label>

        <label htmlFor="textInput" className="textInput">
          <input
            type="text"
            className="input-text"
            id="textInput"
            placeholder="&nbsp;"
          ></input>
          <span className="label">Enter Input</span>
          <span className="focus-bg"></span>
        </label>

        <label htmlFor="textareaInput" className="textInput">
          <textarea
            className="textarea-input"
            id="textareaInput"
            placeholder="&nbsp;"
          ></textarea>
          <span className="label">Enter Details</span>
          <span className="focus-bg"></span>
        </label>

        <div className="select">
          <select defaultValue="">
            <option value="" hidden>
              Select an option
            </option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="4">Option 4</option>
          </select>
        </div>

        <input
          type="number"
          className="input-number"
          id="id"
          min="10"
          max="100"
        ></input>
      </div>
    </div>
  );
}

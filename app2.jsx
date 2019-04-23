const tweaks = {
  name: "Expansive",
  folder: "img/tweaks_multi/",
  grids: ["tbGrid", "hivGrid", "demographicGrid"],
  time: '2019-04-17 15:57:20.266423000 -0400',
  version: '9e261df',
  rangefile: 'rangefile_tweaks',
  digits: 3,
  parameters: [
    {name: "Global risk",          min: 0,      max: 60,     step: 10},
    {name: "Household risk",       min: 0,      max: 60,     step: 10},
    {name: 'P(Initial infection)', min: 0.4,    max: 0.5,    step: 0.05},
    {name: 'Rate of progression',  min: 0.0035, max: 0.1035, step: 0.05}]
};

const progression = {
  name: "Rapid vs Normal progression",
  folder: "img/progression_multi/",
  grids: ["tbGrid", "hivGrid", "demographicGrid"],
  time: '2019-04-18 10:29:28.945783000 -0400',
  version: '9e261df',
  rangefile: 'rf_progression',
  digits: 2,
  parameters: [
    {name: "Rapid progression rate", unit:"(events/yr)", min:0, max:0.15, step:0.025},
    {name: "Normal progression rate", unit: "(events/yr)", min: 0.0035, max: 0.0535, step: 0.005}]
}

const spec = [tweaks, progression];

class GridViewer extends React.Component {
  constructor(props) {
    super(props);

    this.spec = spec;
    const initialRangeIdx = 1;

    this.state = {
      rangeIdx:   initialRangeIdx,
      gridName:   this.spec[initialRangeIdx].grids[0],
      vals:       this.spec[initialRangeIdx].parameters.map(({min}) => min),
      imgNum:     1, // Probably will keep, but do not strictly need
    };
    
    // The two event handlers that deal with sliders and buttons
    this.handleRangeChange = this.handleRangeChange.bind(this);
    this.handleGridChange = this.handleGridChange.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
  }

  handleSliderChange(e) {
    e.preventDefault();

    // Weird lambda-capture stuff - should probably figure out how this works
    const range = this.spec[this.state.rangeIdx];
    const params = range.parameters;

    // Figures out the index of the image to display using the values of the 
    // sliders
    var calcImgNum = function(vals) {

      // Calculate the number of steps for each parameter
      var lengths = params.map(({min, max, step}) => (max-min)/step + 1);

      // The first parameter should be multiplied by 1, and the last parameter
      // should be multiplied by the length of the parameter preceding it.
      // Shift the array to reflect this.
      lengths.unshift(1);
      lengths.pop();
      
      // Multiply (n0, n0*n1, n1*n2*n3), etc to obtain the multipliers
      // for each parameter
      const multipliers = lengths.map(function(i, idx, arr) {
        return arr.slice(0, idx+1).reduce(((acc, cv) => acc*cv), 1);
      });

      // Determine the 'index' that corresponds to each value. I.e., translate
      // the value from the slider (which could be any number) into an unsigned
      // integer between [0, length(parameter)].
      const indices = vals.map((val, idx) => (val - params[idx].min)/params[idx].step);

      // Add all these up to get the (possibly floating-point) index. The images, for now,
      // are 1-index, to the intiial value of the reduction is 1.
      const possiblyFloating = indices.reduce(((acc, cv, idx) => acc + multipliers[idx]*cv), 1);

      // Round to the nearest integer, since sometimes you get really
      // weird values like 49.999999
      return Math.round(possiblyFloating);
    }

    // Extract the value and the parameter associated with the value
    var val = e.target.valueAsNumber;
    var id  = Number.parseInt(e.target.id);

    var vals = this.state.vals;
    vals[id] = val;
  
    // Update the state with new value of the slider,
    // and update the number of the image being displayed
    this.setState({ vals: vals });
    this.setState({ imgNum: calcImgNum(vals) });
  }

  handleRangeChange(e) {
    e.preventDefault();

    // The index of the range to display
    const idx = e.target.value;

    // Reset the sliders to their minumums, the image to the first one
    // in the series, and other state that must be updated.
    this.setState({
      rangeIdx: idx, 
      vals: this.spec[idx].parameters.map(({min}) => min),
      imgNum: 1,
    });
  }

  handleGridChange(e) {
    e.preventDefault();

    const idx = e.target.id;

    this.setState({gridName: this.spec[this.state.rangeIdx].grids[idx]});
  }

  render() {

    // More weird lambda stuff...
    const rangeIdx = this.state.rangeIdx;
    const range = this.spec[rangeIdx];
    const handleRangeChange = this.handleRangeChange;

    const sliderContainers = range.parameters.map((param, idx) =>
      <SliderContainer name={param.name}
                       unit={param.unit}
                       min= {param.min} 
                       max= {param.max} 
                       step={param.step} 
                       id={idx}
                       value={this.state.vals[idx]} 
                       handleChange={this.handleSliderChange}
                       key={idx}/>
    );

    // Use CSS classes to create the button toggle effect. Probably,
    // there is a much more elegant way to do this using React
    const rangeSelectors = this.spec.map(function({name, version, time}, idx) {
      var buttonNames = "pure-button";
      buttonNames = buttonNames + ((idx == rangeIdx) ? " pure-button-disabled" : " pure-button-primary");

      return (
        <option key={idx} value={idx}>
          {name} [{version}] {time}
        </option>
      );
    });

    // imgNum can be used to debug which image is being displayed
    return (
      <div className="pure-g">
        <div className="pure-u-1-5">
          <div className="sidebar">
            <h1>TBABM RangeViewer</h1>
            <form className="pure-form rangeSelector">
              <select value={rangeIdx} onChange={handleRangeChange} className="pure-input-1-1">
                {rangeSelectors}
              </select>
            </form>
            {/*<RunDescription spec={this.spec} rangeIdx={this.state.rangeIdx} />*/}
            <GridSelector spec={this.spec}
                          rangeIdx={this.state.rangeIdx}
                          gridName={this.state.gridName}
                          onChange={this.handleGridChange}/>
            <form>
              {sliderContainers}
            </form>
            {/*<b>imgNum: {this.state.imgNum}</b><br/>*/}
          </div>
        </div>
        <div className="pure-u-4-5">
          <GridImage spec={this.spec}
                     imgNum={this.state.imgNum}
                     rangeIdx={this.state.rangeIdx}
                     gridName={this.state.gridName} />
        </div>
      </div>
    );
  }
}

// A pad function from the StackOverflow swamp
function pad(num, digits) {
  return ('000000000' + num).substr(-digits);   
}

class GridSelector extends React.Component {
  render() {
    const range = this.props.spec[this.props.rangeIdx];

    const gridButtons = range.grids.map((gridName, idx) =>
      <button className={"pure-button" + (this.props.gridName == gridName ? " pure-button-active":"")}
              key={idx}
              id={idx}
              onClick={this.props.onChange}>{gridName}</button>
    );

    return (
      <div className="pure-button-group gridSelector">
        {gridButtons}
      </div>
    );
  }
}

// class RunDescription extends React.Component {
//   render() {
//     const range = this.props.spec[this.props.rangeIdx]

//     return (
//       <div className="runDescription">
//         <div>time: {range.time}</div>
//         <div>version: {range.version}</div>
//       </div>
//     );
//   }
// }

class SliderContainer extends React.Component {
  render() {
    var slider = {
      min:  this.props.min,
      max:  this.props.max,
      step: this.props.step
    };

    return (
      <div className="sliderContainer">
        <h1>{this.props.value}</h1>
        <h2>{this.props.name}</h2>
        <div className="unit">{this.props.unit}</div>
        <Slider id={this.props.id} slider={slider} value={this.props.value} handleChange={this.props.handleChange}/>
      </div>
    );
  }
}

// Props should be:
// 
// id STRING
// slider OBJECT:
//  min
//  max
//  step
// value NUMBER
class Slider extends React.Component {
  render() {
    var id = this.props.id;
    var min = this.props.slider.min;
    var max = this.props.slider.max;
    var step = this.props.slider.step;
    var value = this.props.value;

    const steps = Array(parseInt((max-min)/step) + 1).fill(min).map((val, idx) => val + idx*step);

    const ticks = steps.map((stepVal) => <option key={stepVal} value={stepVal}/>);

    return (
      <div>
        <datalist id={"tickmarks_"+id}>
          {ticks}
        </datalist>
        <input id={id}
               type="range"
               className="slider"
               min={min} 
               max={max} 
               step={step} 
               onChange={this.props.handleChange}
               value={value}
               list={"tickmarks_"+id}/>
      </div>);
  }
}

class GridImage extends React.Component {

  render() {
    const gridSpec = this.props.spec[this.props.rangeIdx];
    console.log(gridSpec);
    const num      = pad(this.props.imgNum, gridSpec.digits);

    const imgSrc_lg    = gridSpec.folder + this.props.gridName + "_" + "lg" + "_" + num + ".png";
    const imgSrc_sm    = gridSpec.folder + this.props.gridName + "_" + "sm" + "_" + num + ".png";
    const imgSrc_sm_2x = gridSpec.folder + this.props.gridName + "_" + "sm_2x" + "_" + num + ".png";

    const sm_src = imgSrc_sm + " " + imgSrc_sm_2x + " 2x";

    return (
      <div className="content">
        <picture>
          <source media="(min-width: 2500px)" srcSet={imgSrc_lg}/>
          <source media="(min-width: 1280px)" srcSet={sm_src}/>
          <img src={imgSrc_sm} className="grid" sty/>
        </picture>
      </div>
    );
  }
}

ReactDOM.render(
  <GridViewer />,
  document.getElementById('mount')
);

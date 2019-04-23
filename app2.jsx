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

const initialization = {
  name: "New initialization technique",
  folder: "img/initialization/",
  grids: ["tbGrid", "hivGrid", "demographicGrid"],
  time: 'hot off the press',
  version: 'the new one',
  rangefile: 'rf_initialization',
  digits: 2,
  parameters: [
    {name: "Init probability of any TB", min: 0.3, max: 0.6, step: 0.05},
    {name: "Init probability of active TB", min: 0.03, max: 0.11, step: 0.01}
  ]
}

const spec = [tweaks, progression, initialization];

class GridViewer extends React.Component {
  constructor(props) {
    super(props);

    this.spec = spec;
    const initialRangeIdxs = [1];

    this.state = {
      rangeIdxs:  initialRangeIdxs,
      gridNames:  initialRangeIdxs.map((i) => this.spec[i].grids[0]),
      vals:       initialRangeIdxs.map((i) => this.spec[i].parameters.map(({min}) => min)),
      imgNums:    initialRangeIdxs.map(()  => 1)
    };
    
    // The two event handlers that deal with sliders and buttons
    this.handleRangeChange = this.handleRangeChange.bind(this);
    this.handleGridChange = this.handleGridChange.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
  }

  handleSliderChange(e) {
    e.preventDefault();

    // Weird lambda-capture stuff - should probably figure out how this works
    // const range = this.spec[this.state.rangeIdx];
    // const params = range.parameters;

    // Figures out the index of the image to display using the values of the 
    // sliders
    var calcImgNum = function(vals, params) {

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
      }).map(Math.round);

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

    var rangeId  = Number.parseInt(e.target.id.split("-")[0]);
    var paramId  = Number.parseInt(e.target.id.split("-")[1]);

    var vals = this.state.vals;
    var imgNums = this.state.imgNums;

    console.log(vals);

    vals[rangeId][paramId] = val;
    imgNums[rangeId] = calcImgNum(vals[rangeId], this.spec[this.state.rangeIdxs[rangeId]].parameters);
  

    // Update the state with new value of the slider,
    // and update the number of the image being displayed
    this.setState({ vals: vals });
    this.setState({ imgNums: imgNums });
  }

  handleRangeChange(e) {
    // e.preventDefault();

    // The index of the range to display
    const idx = Number.parseInt(e.target.id);

    const arrIdx = this.state.rangeIdxs.findIndex((i) => i == idx);
    const onDisplay = arrIdx > -1;

    if (onDisplay && this.state.rangeIdxs.length < 2) {
      e.preventDefault();
      return;
    }

    if (onDisplay) { // Remove from display
      const newIdxs = this.state.rangeIdxs;
      const newVals = this.state.vals;
      const newImgNums = this.state.imgNums;

      newIdxs.splice(arrIdx, 1);
      newVals.splice(arrIdx, 1);
      newImgNums.splice(arrIdx, 1);

      this.setState({
        rangeIdxs: newIdxs,
        vals:      newVals,
        imgNums:   newImgNums
      });

    } else { // Put on display
      this.setState({
        rangeIdxs: this.state.rangeIdxs.concat(idx),
        vals:      this.state.vals.concat([this.spec[idx].parameters.map(({min}) => min)]),
        imgNums:   this.state.imgNums.concat(1)
      });
    }
  }

  handleGridChange(e) {
    e.preventDefault();

    const idx = e.target.id;

    this.setState({
      gridNames: [this.spec[0].grids[idx]]
    });
  }

  render() {

    // More weird lambda stuff...
    const rangeIdxs = this.state.rangeIdxs;
    const handleRangeChange = this.handleRangeChange;
    const spec = this.spec;
    const vals = this.state.vals;

    // Use CSS classes to create the button toggle effect. Probably,
    // there is a much more elegant way to do this using React
    const rangeSelectors = this.spec.map(function({name, version, time}, idx) {
      const checked = rangeIdxs.includes(idx);

      return (
        <div key={idx} className="rangeSelector">
          <input type="checkbox" 
                 name={idx} 
                 id={idx} 
                 defaultChecked={checked} 
                 onChange={handleRangeChange}/>
          <label htmlFor={idx}>{name} [{version}] {time}</label>
        </div>
      );
    });

    const handleSliderChange = this.handleSliderChange;

    const sliderContainers = this.state.rangeIdxs.map(function(rangeIdx, outer_idx) {
      return spec[rangeIdx].parameters.map((param, idx) =>
        <SliderContainer name={param.name}
                         unit={param.unit}
                         min= {param.min} 
                         max= {param.max} 
                         step={param.step} 
                         id={outer_idx + "-" + idx}
                         value={vals[outer_idx][idx]} 
                         handleChange={handleSliderChange}
                         key={idx} />
      );
    });

    // const sliderContainers = range.parameters.map((param, idx) =>
    //   <SliderContainer name={param.name}
    //                    unit={param.unit}
    //                    min= {param.min} 
    //                    max= {param.max} 
    //                    step={param.step} 
    //                    id={idx}
    //                    value={this.state.vals[0][idx]} 
    //                    handleChange={this.handleSliderChange}
    //                    key={idx}/>
    // );

    // imgNum can be used to debug which image is being displayed
    return (
      <div className="pure-g">
        <div className="pure-u-1-5">
          <div className="sidebar">
            <h1>TBABM RangeViewer</h1>
            <form className="pure-form rangeSelectors">
              <div className="pure-input-1-1">
                {rangeSelectors}
              </div>
            </form>
            {/*<RunDescription spec={this.spec} rangeIdx={this.state.rangeIdx} />*/}
            <GridSelector spec={this.spec}
                          rangeIdx={this.state.rangeIdxs[0]}
                          gridName={this.state.gridNames[0]}
                          onChange={this.handleGridChange}/>
            <form>
              {sliderContainers}
            </form>
            {/*<b>imgNum: {this.state.imgNum}</b><br/>*/}
          </div>
        </div>
        <div className="pure-u-4-5">
          <GridImages spec={this.spec}
                      imgNums={this.state.imgNums}
                      rangeIdxs={this.state.rangeIdxs}
                      gridNames={this.state.gridNames} />
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

    const steps = Array(Math.round((max-min)/step) + 1)
      .fill(min)
      .map((val, idx) => val + idx*step)
      .map((val) => Number.parseFloat(val).toFixed(5));

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

class GridImages extends React.Component {

  render() {
    const specs = this.props.spec;
    const imgNums = this.props.imgNums;
    const rangeIdxs = this.props.rangeIdxs;
    const gridNames = this.props.gridNames;

    const images = rangeIdxs.map(function(rangeIdx, idx) {
      const spec = specs[rangeIdx];

      const num = pad(imgNums[idx], spec.digits);

      const imgSrc_lg    = spec.folder + gridNames[0] + "_" + "lg" + "_" + num + ".png";
      const imgSrc_sm    = spec.folder + gridNames[0] + "_" + "sm" + "_" + num + ".png";
      const imgSrc_sm_2x = spec.folder + gridNames[0] + "_" + "sm_2x" + "_" + num + ".png";
      const sm_src       = imgSrc_sm + "\n" + imgSrc_sm_2x + " 2x";

      return (
        <picture key={idx}>
          <source media="(min-width: 2500px)" srcSet={imgSrc_lg}/>
          <source media="(min-width: 1280px)" srcSet={sm_src}/>
          <img src={imgSrc_sm} className="grid" style={{filter: "hue-rotate("+(60*idx).toString()+"deg)"}}/>
        </picture>
      );
    });

    return (
      <div className="content">
        {images}
      </div>
    );
  }
}

ReactDOM.render(
  <GridViewer />,
  document.getElementById('mount')
);

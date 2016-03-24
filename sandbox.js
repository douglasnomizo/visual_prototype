var isP = function(d) {
  return d.constructor.prototype === d && d.hasOwnProperty('constructor');
};

var isF = function(d) {
  return typeof d === 'function';
};

var isO = function(d) {
  return !(isP(d)) && !isF(d);
};


var getName = function(d) {
  return d.name || d.constructor.name;
}

function findPrototype(obj, list) {
  if (list === undefined) {
    list = [];
  }
  var proto = Object.getPrototypeOf(obj);
  if (proto === null) {
    return list;
  } else {
    list.push({ source: proto, target: obj });
  }
  return findPrototype(proto, list);
}


var width = 1400,
    height = 1200;

function Sandbox(el) {
  this.objects = [];
  this.prototype_chain = [];
  this.svg = d3.select(el).append("svg").attr("width", width).attr("height", height);
  this.force = d3.layout.force().charge(-1200).linkDistance(300).size([width, height]);
}

Sandbox.prototype.add = function(obj) {
  this.objects.push(obj);
  var prototypes = findPrototype(obj);

  this.objects.forEach(function(o) {
    if (o.hasOwnProperty('constructor')) {
      this.objects.push(o.constructor);
      this.prototype_chain.push({source: o.constructor, target: o, value: 1 });
      this.prototype_chain.push({source: o, target: o.constructor, value: 2 });
    }
  }, this)

  this.objects = _.union(this.objects, prototypes.map(function(p) { return p.source; }), prototypes.map(function(p) { return p.target; }))

  prototypes.forEach(function(p) {
    this.prototype_chain.push({
      source: this.objects.indexOf(p.source),
      target: this.objects.indexOf(p.target)
    });
  }, this);

};

Sandbox.prototype.draw = function() {
  this.force.nodes(this.objects).links(this.prototype_chain).start();

  var link = this.svg.selectAll(".link")
      .data(this.prototype_chain)
    .enter().append("line")
      .attr("class", "link");

  var groups = this.svg.selectAll('.node')
    .data(this.objects)
    .enter()
    .insert('g');

  var node = groups.append("circle")
      .attr("class", "node")
      .attr("r", 50)
      .classed('prototype', isP)
      .classed('object', isO)
      .classed('function', isF)
      .call(this.force.drag);

  groups.append("text")
      .attr("dx", -25)
      .attr("dy", 15)
      .text(getName)
      .style("stroke", "gray");

  groups.append("text")
      .attr("dx", -25)
      .attr("dy", -10)
      .text(function(d) {
        if (isP(d)) { return '[Prototype]'; }
        if (isF(d)) { return '[Function]'; }
      })
      .style("stroke", "gray");
    this.force.start();

  this.force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    d3.selectAll("text")
        .attr("x", function (d) {return d.x; })
        .attr("y", function (d) {return d.y; });
  });
}


var container = document.getElementById('container');
s = new Sandbox(container);


function Cao() {}
function Gato() {}

cao1 = new Cao();
cao1.name = 'Dodge';

gato1 = Object.create(Gato.prototype);
gato1.name = 'Neo';

gato2 = new Gato();
gato2.name = 'Lili';

s.add(cao1);
s.add(gato1);
s.add(gato2);
s.draw();

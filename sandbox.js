var container = document.getElementById('container');
var options = {

}
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

var Sandbox = (function(el, options) {
  var config = { width: 1400, height: 1200, charge: -1200, linkDistance: 300, circleSize: 40 }; _.merge(config, options);
  var nodes = [], links = [];

  var force = d3.layout.force().charge(config.charge).nodes(nodes).links(links).linkDistance(config.linkDistance).size([config.width, config.height]).on('tick', _tick);
  var svg = d3.select(el).append('svg').attr('width', config.width).attr('height', config.height);
  var node = svg.selectAll('.node');
  var link = svg.selectAll('.link');

  function _addId(object) {
    if (!Object.hasOwnProperty('id')) {
      object.id = Math.random().toString(16).slice(2);
    }
  };

  function _tick() {
    node.attr('cx', function(d) { return d.x; }).attr('cy', function(d) { return d.y; });
    link.attr('x1', function(d) { return d.source.x; }).attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; }).attr('y2', function(d) { return d.target.y; });
  }

  function _findPrototype(obj, list) {if (list === undefined) { list = []; } var proto = Object.getPrototypeOf(obj); if (proto === null) {return list; } else {list.push({ source: proto, target: obj }); } return _findPrototype(proto, list); }

  function _updatePrototypeChainFor(newObject) {
    var prototypes = _findPrototype(newObject);

    nodes = _.union(nodes, prototypes.map(function(p) { return p.source; }));
    nodes.map(function(obj) { _addId(obj); });

    prototypes.forEach(function(p) {
      links.push({
        source: p.source,
        target: p.target
      });
    });
  }

  function _updateGraph() {
    link = link.data(links, function(d) { return d.source.id + '-' + d.target.id; });
    link.enter().insert('line', '.node').attr('class', 'link');
    link.exit().remove();

    node = node.data(nodes, function(d) { return d.id;});
    node.enter().append('g').attr('r', config.circleSize)
      .append('circle')
      .attr('class', 'node')
      .attr('r', config.circleSize)
      .classed('prototype', isP)
      .classed('object', isO)
      .classed('function', isF);
    node.exit().remove();


    // node = node.data(nodes, function(d) { return d.id; });
    // var groups = node.enter().append('g');
    // node.exit().remove();



    // node = node.data(nodes, function(d) { return d.id;});
    // var groups = node.enter().append('g');

    // // var groups = this.svg.selectAll('.node')
    // //   .data(this.objects)
    // //   .enter()
    // //   .insert('g');


    // var node = groups.append('circle');
      // .attr('class', 'node')
      // .attr('r', config.circleSize)
      // .classed('prototype', isP)
      // .classed('object', isO)
      // .classed('function', isF);

    // groups.append('text')
    //     .attr('dx', -25)
    //     .attr('dy', 15)
    //     .text(getName)
    //     .style('stroke', 'gray');

    // groups.append('text')
    //     .attr('dx', -25)
    //     .attr('dy', -10)
    //     .text(function(d) {
    //       if (isP(d)) { return '[Prototype]'; }
    //       if (isF(d)) { return '[Function]'; }
    //     })
    //     .style('stroke', 'gray');

    // node.exit().remove();




    force.start();
  }

  return {
    add: function(object) {
      nodes.push(object);
      _updatePrototypeChainFor(object);
    },

    update: function() {
      _updateGraph();
    },

    nodes: function() {
      return nodes;
    },

    links: function() {
      return links;
    }
  };

}(container, options));

var width = 1400,
    height = 1200;

function S(el) {
  this.objects = [];
  this.prototype_chain = [];
  this.svg = d3.select(el).append('svg').attr('width', width).attr('height', height);
  this.force = d3.layout.force().charge(-1200).linkDistance(300).size([width, height]);
}

S.prototype.add = function(obj) {
  this.objects.push(obj);
  var prototypes = _findPrototype(obj);

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

function _findPrototype(obj, list) {if (list === undefined) { list = []; } var proto = Object.getPrototypeOf(obj); if (proto === null) {return list; } else {list.push({ source: proto, target: obj }); } return _findPrototype(proto, list); }

S.prototype.draw = function() {
  this.force.nodes(this.objects).links(this.prototype_chain).start();

  var link = this.svg.selectAll('.link')
      .data(this.prototype_chain)
    .enter().append('line')
      .attr('class', 'link');

  var groups = this.svg.selectAll('.node')
    .data(this.objects)
    .enter()
    .insert('g');

  var node = groups.append('circle')
      .attr('class', 'node')
      .attr('r', 50)
      .classed('prototype', isP)
      .classed('object', isO)
      .classed('function', isF)
      .call(this.force.drag);

  groups.append('text')
      .attr('dx', -25)
      .attr('dy', 15)
      .text(getName)
      .style('stroke', 'gray');

  groups.append('text')
      .attr('dx', -25)
      .attr('dy', -10)
      .text(function(d) {
        if (isP(d)) { return '[Prototype]'; }
        if (isF(d)) { return '[Function]'; }
      })
      .style('stroke', 'gray');
    this.force.start();

  this.force.on('tick', function() {
    link.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

    node.attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });

    d3.selectAll('text')
        .attr('x', function (d) {return d.x; })
        .attr('y', function (d) {return d.y; });
  });
}

s = new S(container);

function Cao() {}
function Gato() {}

cao1 = new Cao();
cao1.name = 'Dodge';

gato1 = Object.create(Gato.prototype);
gato1.name = 'Neo';

gato2 = new Gato();
gato2.name = 'Lili';

gato3 = Object.create(gato1);

s.add(cao1);
s.add(gato1);
s.add(gato2);
s.draw();


Sandbox.add(cao1);
Sandbox.update();


// nodes.forEach(function(obj) {
//   if (obj.hasOwnProperty('constructor')) {
//     nodes.push(obj.constructor);
//     links.push({source: obj.constructor, target: obj });
//     links.push({source: obj, target: obj.constructor });
//   }
// });

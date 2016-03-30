var isP = function(d) {
  return d.constructor.prototype === d && d.hasOwnProperty('constructor');
};

var isF = function(d) {
  return typeof d === 'function' && d !== Function.prototype;
};

var isO = function(d) {
  return !(isP(d)) && !isF(d);
};


var getName = function(d) {
  if (isO(d)) {
    return d.name || d.constructor.name + ' sem nome';
  }
  return  d.name || d.constructor.name || 'Object';
}

var width = 1400,
    height = 1200;

function S(el) {
  this.objects = [];
  this.prototype_chain = [];
  this.svg = d3.select(el).append('svg').attr('width', width).attr('height', height);
  this.force = d3.layout.force().charge(-1200).linkDistance(380).size([width, height]);
}

S.prototype.add = function(obj) {
  this.prototype_chain = [];
  this.objects.push(obj);
  var prototypes = _findPrototype(obj);

  this.objects.forEach(function(o) {
    if (o.hasOwnProperty('constructor')) {
      this.objects.push(o.constructor);
      this.prototype_chain.push({source: o.constructor, target: o });
    }

    if (isO(o)) {
      this.prototype_chain.push({source: o, target: o.__proto__ });
    }
  }, this)

  this.objects = _.union(this.objects, prototypes.map(function(p) { return p.source; }));

  prototypes.forEach(function(p) {
    this.prototype_chain.push({
      source: this.objects.indexOf(p.source),
      target: this.objects.indexOf(p.target)
    });
  }, this);

  this.update();
};

function _findPrototype(obj, list) {
  if (list === undefined) {
    list = [];
  }
  var proto = Object.getPrototypeOf(obj);

  if (proto === null) {
    return list;
  } else {
    list.push({ source: proto, target: obj });
  }

  return _findPrototype(proto, list);
}

S.prototype.update = function() {
  this.svg.selectAll('.link').remove();
  this.svg.selectAll('.node').remove();

  this.force.nodes(this.objects).links(this.prototype_chain).start();

  var link = this.svg.selectAll('.link')
      .data(this.prototype_chain)
    .enter().append('line')
      .attr('class', 'link');

  var groups = this.svg.selectAll('.node')
    .data(this.objects)
    .enter()
    .insert('g');

  var node = groups.append('rect')
      .attr('class', 'node')
      .attr('width', 180)
      .attr('height', 70)
      .classed('prototype', isP)
      .classed('object', isO)
      .classed('function', isF)
      .call(this.force.drag);

  groups.append('text')
      .attr('dx', 10)
      .attr('dy', 15)
      .text(getName)
      .style('stroke', 'gray');

  groups.append('text')
      .attr('dx', 70)
      .attr('dy', 15)
      .text(function(d) {
        if (isP(d)) { return '[Prototype]'; }
        if (isF(d)) { return '[Function]'; }
      })
      .style('stroke', 'gray');

  groups.append('text')
      .attr('dx', 5)
      .attr('dy', 50)
      .text(function(d) {
        var text = "";
        for (x in d) {
          if (!_.includes(['index', 'x', 'y', 'weight', 'px', 'py', 'fixed'], x)) {
            if (d.hasOwnProperty(x)) {
              text += x.toUpperCase() + ' | ';
            } else {
              text += x + ' | ';
            }
          }
        }
        return  text.substring(0, text.length - 2);
      })
      .style('stroke', 'gray');

  this.force.start();

  this.force.on('tick', function() {
    link.attr('x1', function(d) { return d.source.x + 75 })
        .attr('y1', function(d) { return d.source.y + 30 })
        .attr('x2', function(d) { return d.target.x + 75 })
        .attr('y2', function(d) { return d.target.y + 30 });

    node.attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y; });

    d3.selectAll('text')
        .attr('x', function (d) {return d.x; })
        .attr('y', function (d) {return d.y; });
  });
}

s = new S(container);


//parte 1 - function e new

function Gato(name){
  this.name = name
}
s.add(Gato.prototype);

Gato.prototype.mia = true
s.update();

gato1 = new Gato("Felix")
s.add(gato1);

gato2 = Object.create(Gato.prototype)
s.add(gato2);


// //sem ligação automática:
Object.create(null);

// Para criar um objeto, pode-se usar:
// - new Object
// - {}
// - Object.create(Object.prototype);

gato3 = new Object;
s.add(gato3);

gato3.__proto__ = Gato.prototype
//  gato3.setPrototypeOf(Gato.prototype)
s.add(gato3);



// //parte 2 - as ligações se mantém

Gato.prototype.mia = function(){
  console.log("Miaaaaaaaaauuuu!!!")
}

gato1.mia()
gato2.mia()


gato1.__proto__.mia = "sim, algum problema?"
s.add(gato1)


console.log(gato3.mia);


// //ou seja: mudando o corpo da função não interferimos via ligações

// //parte3 - conclusão e OLOO

// //não há herança, mas agora temos as ferramentas para "linkar" objetos.

function Animal(){
}

Animal.prototype.mia = "default"
Animal.prototype.souAnimal = true
s.add(Animal.prototype)

gato1.__proto__.__proto__ = Animal.prototype
s.add(gato1)

// // // prototype chain

gato4 = new Gato("Gato Animal!")
s.add(gato4)


gato5 = Object.create(gato4)
s.add(gato5)


(function (window) {

  // JSLint settings
  // browser: true, maxerr: 50, indent: 2
  'use strict';

  var gyudon = window.gyudon,

    SolarSystem,

    ucfirst = function (str) {
      return str.charAt(0).toUpperCase() + str.substr(1);
    };

  SolarSystem = function (container) {

    this.zoom = 1;

    this.c = new gyudon.Manager(1200, 700);
    container.appendChild(this.c.e);
    container = null;
    this.c.start();

    var rect = new gyudon.Item.Rect({
      fill: 'black',
      frame: new gyudon.Frame(0, 0, this.c.width, this.c.height)
    });
    this.c.addItem(rect);

    var that = this;
    rect.
      bind('moveinside', function (e) {
        that.updateZoom(e.pos.x);
      }).
      bind('down', function (e) {
        that.updateZoom(e.pos.x);
      });

    this.createSolarSystem();

    var title = new gyudon.Item.Text({
      text: 'The Solar System',
      fill: 'yellow',
      coord: new gyudon.Coord(this.c.width - this.c.height * 0.05, this.c.height * 0.05),
      align: 'right',
      baseline: 'top',
      font: 'bold 2em sans-serif'
    });
    this.c.addItem(title);

  };

  SolarSystem.prototype = {

    constructor: SolarSystem,

    createSolarSystem: function () {
      var planet_names = 'mercury venus earth mars jupiter saturn uranus neptune'.split(' ');

      this.sun = this.createSun();
      this.c.addItem(this.sun);

      this.planets = [];

      gyudon.Util.each(planet_names, function (planet_name) {
        var method = 'create' + ucfirst(planet_name);

        var planet = this[method]();
        this.sun.addItem(planet);
        this.planets.push(planet);
        planet.bind('moveinside', function () {
          this.stroke = 'white';
          this.needsRedraw();
        }).bind('out', function () {
          this.stroke = false;
          this.needsRedraw();
        });

        var rotate;
        (rotate = function () {
          planet.rotateBy(5000, Math.PI, rotate);
        })();

        var label = new gyudon.Item.Text({
          text: ucfirst(planet_name),
          coord: new gyudon.Coord(
            planet.move.x + planet.frame.size.width / 2,
            this.c.height * 0.5
          ),
          align: 'center',
          baseline: 'middle',
          fill: 'white'
        });
        this.sun.addItem(label);
        planet.planet_label = label;
      }, this);
    },

    createSun: function () {
      return this.createPlanet(2, 0, 0, 'yellow');
    },

    createMercury: function () {
      return this.createPlanet(0.3825, 0.38, 0, 'brown');
    },

    createVenus: function () {
      return this.createPlanet(0.9488, 0.72, 0, 'orange');
    },

    createEarth: function () {
      return this.createPlanet(1, 1, 1, 'blue');
    },

    createMars: function () {
      return this.createPlanet(0.53226, 1.52, 2, 'red');
    },

    createJupiter: function () {
      return this.createPlanet(11.209, 5.2, 4, 'orange');
    },

    createSaturn: function () {
      return this.createPlanet(9.449, 9.53, 9, 'brown');
    },

    createUranus: function () {
      return this.createPlanet(4.007, 19.19, 6, 'skyblue');
    },

    createNeptune: function () {
      return this.createPlanet(3.883, 30.06, 3, 'blue');
    },

    createPlanet: function (radius_e, distance_au, moon_count, colour) {
      var planet, i, radius, distance, moon, moon_radius, moon_distance, moon_coord;

      radius = this.convertRadiusFromE(radius_e);
      distance = this.convertDistanceFromAU(distance_au);

      moon_radius = this.convertRadiusFromE(0.273);
      moon_distance = radius + moon_radius * 4.5;
      
      planet = new gyudon.Item.Circle({
        radius: radius,
        fill: colour,
        center: new gyudon.Coord(distance * 1.75, distance)
      });
      planet.setPivot(new gyudon.Coord(radius, radius));

      planet.radius_e = radius_e;
      planet.distance_au = distance_au;

      for (i = 0; i < moon_count; i++) {
        moon_coord = this.positionOfMoon(i, moon_count, moon_distance, radius);
        moon = new gyudon.Item.Circle({
          radius: moon_radius,
          fill: 'gray',
          center: new gyudon.Coord(
            moon_coord.x * moon_distance + radius,
            moon_coord.y * moon_distance + radius
          ),
        });
        moon.moon_coord = moon_coord;
        planet.addItem(moon);
      }

      return planet;
    },

    convertRadiusFromE: function (radius) {
      return radius * 6378.1 / 1000 * 0.5 * this.zoom;
    },

    convertDistanceFromAU: function (distance) {
      return distance * 14.9597890 * 1.5 * this.zoom;
    },

    positionOfMoon: function (index, total) {
      var angle = index / total * gyudon.Math.TWO_PI;
      return new gyudon.Coord(
        gyudon.Math.cos(angle),
        gyudon.Math.sin(angle)
      );
    },

    updateZoom: function (mouse_x) {
      this.zoom = this.c.width / mouse_x;

      gyudon.Util.each(this.planets, function (planet) {
        var radius = this.convertRadiusFromE(planet.radius_e);
        var distance = this.convertDistanceFromAU(planet.distance_au);

        planet.frame.size = new gyudon.Size(radius * 2, radius * 2);
        planet.move = new gyudon.Coord(distance * 1.75 - radius, distance - radius)
        planet.planet_label.move = new gyudon.Coord(
          planet.move.x + planet.frame.size.width / 2,
          this.c.height * 0.5
        );
        planet.setPivot(new gyudon.Coord(radius, radius));

        gyudon.Util.each(planet.items, function (moon) {
          if (!moon.moon_coord) {
            return;
          }
          var moon_radius = this.convertRadiusFromE(0.273),
            moon_distance = radius + moon_radius * 4.5;

          moon.frame.size = new gyudon.Size(moon_radius * 2, moon_radius * 2);
          moon.move = new gyudon.Coord(
            moon.moon_coord.x * moon_distance + radius - moon_radius,
            moon.moon_coord.y * moon_distance + radius - moon_radius
          );
        }, this);
      }, this);

      this.c.needsRedraw();
    }

  };

  window.onload = function () {
    var solarsystem = new SolarSystem(document.getElementById('main'));
    window.solarsystem = solarsystem;
  };

}(window));

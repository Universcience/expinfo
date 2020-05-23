/* LangtonColony - An HTML5/JS implementation of Langton's ants.
 * Copyright (c) 2020 - Jérôme Kirman
 * 
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * A full copy of the GNU Affero General Public License is available
 * at the following URL: <http://www.gnu.org/licenses/>.
 */

'use strict';

let int = Math.floor, round = Math.round, max = Math.max, min = Math.min;
function get(name) { return document.getElementById(name); }
function hexcol(x) { return x.toString(16).padStart(6, "0"); }
function dellipse(c, x, y, rx, ry=rx, rot=0, sa=0, ea=2*Math.PI, acw=false) { c.ellipse(x, y, rx, ry, rot, sa, ea, acw); }
function clamp (a,x,b) { return min(max(a, x), b); }
function do_clamp (input) { return get(input).value = clamp(get(input).min, get(input).value, get(input).max); }

function ppixel (bmpd, x, y, w, r, g, b, a=0xFF)
{
	let p = 4*w*y + 4*x;
	bmpd[p+0] = r;
	bmpd[p+1] = g;
	bmpd[p+2] = b;
	bmpd[p+3] = a;
}

function tableau2d (larg, haut)
{
	let t = new Array(larg);
	for (let x = 0 ; x < t.length ; x++) {
		t[x] = new Array(haut);
		t[x].fill(0, 0, haut);
	}
	return t;
}

// Logique
const IMAX = 32;
const DH=0, DG=1, DB=2, DD=3;
let grille = [];
let fourmis = [];
let nidf = 0;

let semantique = "fourmis";
let cases = [];

// Déplace la fourmi selon sa direction actuelle.
function pas (f)
{
	if (f.dir == DH) f.j--;
	if (f.dir == DG) f.i--;
	if (f.dir == DB) f.j++;
	if (f.dir == DD) f.i++;
}

// Double les dimensions de la grille en ajoutant des cases vides dans toutes les directions.
function doubler_grille ()
{
	let ngrille = tableau2d(2*grille.length, 2*grille[0].length);
	let coin = {i: int(ngrille.length / 4), j: int(ngrille[0].length / 4)};
	for (let i = 0 ; i < grille.length ; ++i)
		for (let j = 0 ; j < grille[i].length ; ++j)
			ngrille[i+coin.i][j+coin.j] = grille[i][j];

	grille = ngrille;

	// Replacement des fourmis dans la nouvelle grille
	for (let f of fourmis) {
		f.i += coin.i;
		f.j += coin.j;
	}

	// Ajustement des cases marquées
	for (let c of cases) {
		c.i += coin.i;
		c.j += coin.j;
	}

	return coin;
}

// Dessin
let cote = 10;
let vue = {x:0, y:0};
let palette = new Array(IMAX);
let cadre = get("cadre");
let toile = cadre.getContext("2d");

// Contrôle
let stop = true
let eps = 5;
let id = 0;

let prog = [], nprog = new Array(IMAX);
let nnbi = 0;

// Dessine un triangle représentant la fourmi f.
function peindre_fourmi (f)
{
	toile.save();
	toile.translate((f.i+0.5)*cote - vue.x, (f.j+0.5)*cote - vue.y);
	toile.rotate(-f.dir*Math.PI/2);
	toile.beginPath();
	toile.moveTo(      0, -cote/2);
	toile.lineTo(-cote/2,  cote/2);
	toile.lineTo( cote/2,  cote/2);
	toile.fillStyle = "#"+hexcol(f.coul);
	toile.fill();
	toile.restore();
}

// Redessine l'ensemble des fourmis.
function repeindre_fourmis ()
{
	for (let f of fourmis)
		peindre_fourmi(f);
}

// Actualise la couleur de la case ciblée.
function repeindre_case (i, j)
{
	if (i < 0 || i >= grille.length || j < 0 || j >= grille[i].length)
		toile.fillStyle = "#" + hexcol(palette[0]);
	else
		toile.fillStyle = "#" + hexcol(palette[grille[i][j]]);

	toile.fillRect(i*cote - vue.x, j*cote - vue.y, cote, cote);
}

// Vue de près : chaque case est représentée par un carré de pixels sur le canevas.
function repeindre_cases ()
{
	for (let i = int( vue.x / cote ) ; i <= int( (vue.x + cadre.width) / cote ) ; ++i)
		for (let j = int( vue.y / cote ) ; j <= int( (vue.y + cadre.height) / cote ) ; ++j)
			repeindre_case(i, j)
}

// Calcule la couleur moyenne des cases en x,y et actualise l'image fournie ou, à défaut, le canevas.
function repeindre_pixel (x, y, bitmap=null)
{
	let do_write = (bitmap == null);
	if (do_write)
		bitmap = toile.getImageData(0, 0, cadre.width, cadre.height);

	let region = int(1/cote);
	let coin = {i: (vue.x+x)*region, j: (vue.y+y)*region};

	// Moyenne des couleurs de la région
	let s = 0;
	for (let i = coin.i ; i < coin.i + region ; ++i)
		for (let j = coin.j ; j < coin.j + region ; ++j)
			if (i >= 0 && i < grille.length && j >= 0 && j < grille[i].length)
				s += grille[i][j];

	let c = palette[round(s / (region*region))];
	ppixel(bitmap.data, x, y, cadre.width, (c >> 16) & 0xFF, (c >> 8) & 0xFF, (c >> 0) & 0xFF);

	if (do_write)
		toile.putImageData(bitmap, 0, 0, x, y, 1, 1);	
}

// Vue de loin : chaque pixel adopte la couleur moyenne des cases qu'il représente.
function repeindre_pixels ()
{
	let bitmap = toile.getImageData(0, 0, cadre.width, cadre.height);
	for (let x = 0 ; x < cadre.width ; ++x)
		for (let y = 0 ; y < cadre.height ; ++y)
			repeindre_pixel(x, y, bitmap);

	toile.putImageData(bitmap, 0, 0);
}

// Rafraîchir la vue centrale selon le niveau de zoom, suite à la modification d'une seule case.
function repeindre_local (i, j)
{
	if (cote > 1)
		repeindre_case(i, j);
	else {
		let region = int(1/cote);
		let x = int(i/region) - vue.x, y = int(j/region) - vue.y;
		if (x >= 0 && x < cadre.width && y >= 0 && y < cadre.height)
			repeindre_pixel(x, y);
	}
}

// Rafraîchir la vue centrale, zone par zone ou pixel par pixel selon le niveau de zoom.
function repeindre ()
{
	if (cote > 1)
		repeindre_cases();
	else
		repeindre_pixels();

	repeindre_fourmis();
}

// Ajuste le grossissement autour d'une position absolue.
function zoomer (x, y)
{
	let zoom = +get("zoom").value; //NOTE: Footgun.
	let acote = cote;

	let facteur;
	if (zoom < 0) {
		facteur = -zoom + 1;
		get("cote").innerHTML = "x" + "1/" + facteur;
		cote = 1/facteur;
	} else {
		facteur = zoom + 1;
		get("cote").innerHTML = "x" + facteur;
		cote = facteur;
	}

	vue.x += int(cote*(x/acote - x/cote));
	vue.y += int(cote*(y/acote - y/cote));

	repeindre();
}

// Aggrandit la grille et ajuste la vue de manière transparente.
function ajuster_grille ()
{
	let coin = doubler_grille();
	vue.x += int(coin.i * cote);
	vue.y += int(coin.j * cote);
	repeindre();
}

// Avance la fourmi d'un pas en modifiant ou en marquant sa case précédente.
function avancer_fourmi(f, changer_case=true, marquer_case=false)
{
	let fi = f.i, fj = f.j;
	let couleur = min(grille[f.i][f.j], prog.length-1);
	f.dir = (f.dir + prog[couleur])%4;

	if (marquer_case)
		cases.push ({ i: fi, j: fj });

	if (changer_case) {
		grille[f.i][f.j] = (couleur + 1) % prog.length;
		repeindre_local(f.i, f.j);
	}

	pas(f);

	if (f.i < 0 || f.i >= grille.length || f.j < 0 || f.j >= grille[0].length)
		ajuster_grille();

	get("f_"+f.id+"x").innerHTML = int(f.i - grille.length/2);
	get("f_"+f.id+"y").innerHTML = int(f.j - grille[0].length/2);

	peindre_fourmi(f);
}

// Avance la simulation d'une étape.
function avancer ()
{
	switch (semantique) {
	case "fourmi":
		let f = fourmis.shift();
		fourmis.push(f);
		avancer_fourmi(f);
		break;

	default:
	case "fourmis":
		for (let f of fourmis)
			avancer_fourmi(f);
		break;

	case "case_simple":
	case "case_multiple":
		cases = [];
		for (let f of fourmis)
			avancer_fourmi(f, false, (semantique == "case_multiple" || !cases.some( (c) => c.i == f.i && c.j == f.j )));

		for (let c of cases) {
			grille[c.i][c.j] = (min(grille[c.i][c.j], prog.length-1) + 1) % prog.length;
			repeindre_local(c.i, c.j);
		}
		break;
	}
}

// Ajoute une fourmi dans la grille et l'interface.
function ajouter_fourmi (fx, fy, fdir=DH, fcoul=0x000000)
{
	let fi, fj, ext;
	do {
		fi = int(fx + grille.length/2);
		fj = int(fy + grille[0].length/2); 

		ext = fi < 0 || fi >= grille.length || fj < 0 || fj >= grille[0].length;
		if (ext) 
			ajuster_grille();
	} while(ext);

	get("colonie").insertAdjacentHTML("beforeend",
`<fieldset id="f_`+nidf+`">
	<legend title="Position actuelle de la fourmi.">(<span id="f_`+nidf+`x">`+fx+`</span>,<span id="f_`+nidf+`y">`+fy+`</span>)</legend>
	<button onclick="f_centrer(`+nidf+`)" title="Centre l'affichage sur les coordonnées de cette fourmi.">Centrer vue</button>
	<button onclick="f_suppr(`+nidf+`)" title="Tue la fourmi. :(">Supprimer</button>
</fieldset>`);

	fourmis.push( { id: nidf, i: fi, j: fj, dir: fdir, coul: fcoul } );
	nidf++;

}

// Réinitialise les données et l'interface.
function reinit ()
{
  get("colonie").querySelectorAll('[id^="f_"]').forEach( (e) => e.remove() );
  get("fxpos").value = 0;
  get("fypos").value = 0;

  grille = tableau2d(4, 4);
  fourmis = [];
  nidf = 0;

  get("reinit").disabled = true;

  stop = true;
  clearInterval(id);
  get("simuler").innerHTML = "Avance rapide";

  vue = {x:0, y:0};
  repeindre();
}

// Modifie la couleur de l'élément ciblé (fourmi ou instruction)
function changer_couleur (id, c)
{
	let cible = get(id);
	if (!cible) return;

	cible.style.backgroundColor = "#" + hexcol(c);
	if (id == "fcoul")
		fcoul = c;
	else // (id == "i_Xc")
		palette[+id.slice(2,-1)] = c;

	repeindre();
}

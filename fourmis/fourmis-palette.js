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

let pselect = { h: 0, s: 0, v: 0 };
let pinvoc = "";

// Conversion de HSV (360/100/100) vers RGB (255/255/255)
function hsv2rgb (h, s, v)
{
	s /= 100; v /= 100;
	let q = h/60;
	let c1 = s*v;
	let c2 = c1 * (1 - Math.abs(q%2 - 1));
	let r,g,b;
	switch (int(q)%6) {
		case 0: r = c1; g = c2; b =  0; break;
		case 1: r = c2; g = c1; b =  0; break;
		case 2: r =  0; g = c1; b = c2; break;
		case 3: r =  0; g = c2; b = c1; break;
		case 4: r = c2; g =  0; b = c1; break;
		case 5: r = c1; g =  0; b = c2; break;
	}

	let l = v-c1;
	return { r: round(255*(r+l)), g: round(255*(g+l)), b: round(255*(b+l)) };
}

// Conversion de RGB (255/255/255) vers HSV (360/100/100)
function rgb2hsv (r, g, b)
{
	r /= 255; g /= 255; b /= 255;
	let c1 = max(r, max(g, b));
	let c3 = min(r, min(g, b));
	let c = c1 - c3;
	let h = 60;
	if (c == 0)
		h = 0;
	else if (c1 == r)
		h *= (g-b)/c + 0;
	else if (c1 == g)
		h *= (b-r)/c + 2;
	else // (c1 == b)
		h *= (r-g)/c + 4;
	h = (h+360)%360;
	let s = (c1 == 0) ? 0 : c / c1;
	return { h: h, s: 100*s, v: 100*c1 };
}

const THAUT = get("pteinte").height,
     SVCOTE = get("psatval").height;
function maj_palette (garder_rgb=false)
{
	let h = pselect.h, s = pselect.s, v = pselect.v;
	let pteinte = get("pteinte").getContext("2d"),
	    psatval = get("psatval").getContext("2d");

	// Barre de teinte + curseur
	let bmp = pteinte.getImageData(0, 0, 360, THAUT);
	for (let i = 0 ; i < 360 ; ++i) {
		let c = hsv2rgb(i, 100, 100);
		for (let j = 0 ; j < THAUT ; ++j)
			ppixel(bmp.data, i, j, 360, c.r, c.g, c.b);
	}

	pteinte.putImageData(bmp, 0, 0, 0, 0, 360, THAUT);
	pteinte.fillRect(h-2, 0, 2, THAUT);
	pteinte.fillRect(h+1, 0, 2, THAUT);

	// Champ saturation/valeur + viseur
	bmp = psatval.getImageData(0, 0, SVCOTE, SVCOTE);
	for (let i = 0 ; i < SVCOTE; ++i)
		for (let j = 0 ; j < SVCOTE ; ++j) {
			let c = hsv2rgb(h, 100*i/SVCOTE, 100*(1-j/SVCOTE));
			ppixel(bmp.data, i, j, SVCOTE, c.r, c.g, c.b);
		}
	psatval.putImageData(bmp, 0, 0, 0, 0, SVCOTE, SVCOTE);

	psatval.strokeStyle = (v > 50) ? "#000000" : "#FFFFFF";
	psatval.beginPath();
	dellipse(psatval, SVCOTE*s/100, SVCOTE*(100-v)/100, 3);
	psatval.stroke();

	// Nouvelle couleur
	let rgb = hsv2rgb(h, s, v);
	let pnouv = get("pnouv").getContext("2d");
	pnouv.fillStyle = "#" + hexcol(rgb.r << 16 | rgb.g << 8 | rgb.b);
	pnouv.fillRect(0, 0, pnouv.canvas.width, pnouv.canvas.height);

	get("ph").value = round(h);
	get("ps").value = round(s);
	get("pv").value = round(v);

	if (!garder_rgb) {
		let rgb = hsv2rgb(pselect.h, pselect.s, pselect.v);
		get("pr").value = round(rgb.r);
		get("pg").value = round(rgb.g);
		get("pb").value = round(rgb.b);
	}
}

// Actions des éléments HTML

function p_maj (id)
{
	do_clamp(id);

	let rgb = ["pr", "pg", "pb"].includes(id);
	if (rgb)
		pselect = rgb2hsv(+get("pr").value, +get("pg").value, +get("pb").value);
	else
		pselect = { h: +get("ph").value, s: +get("ps").value, v: +get("pv").value };

	maj_palette(rgb);
}

function p_fermer (valider=false)
{
	get("palette").style.display = "none";

	if (!valider) return;

	let rgb = hsv2rgb(pselect.h, pselect.s, pselect.v);
	changer_couleur(pinvoc, rgb.r << 16 | rgb.g << 8 | rgb.b);
}

// Désigne une teinte ou une paire saturation/couleur par l'interface souris.
function pointer_hsv (e)
{
	if (e.type == "pointerdown")
		e.target.setPointerCapture(e.pointerId);

	if (!e.target.hasPointerCapture(e.pointerId)) return;

	if (e.target.id == "psatval")
		pselect = { h: pselect.h, s: clamp(0, 100*e.offsetX/SVCOTE, 100), v: 100 - clamp(0, 100*e.offsetY/SVCOTE, 100) };
	else // (e.target.id == "pteinte")
		pselect = { h: clamp(0, e.offsetX, 360), s: pselect.s, v: pselect.v };

	maj_palette();
}

// Invoque le sélecteur de couleurs pour le bouton id.
function ouvrir_palette (id, c=0xFFFFFF)
{
	get("palette").style.display = "grid";

	let r = c >> 16 & 0xFF, g = c >> 8 & 0xFF, b = c & 0xFF;
	pinvoc = id;
	pselect = rgb2hsv(r, g, b);

	let pprec = get("pprec").getContext("2d");
	pprec.fillStyle = "#" + hexcol(c);
	pprec.fillRect(0, 0, pprec.canvas.width, pprec.canvas.height);

	maj_palette();
}

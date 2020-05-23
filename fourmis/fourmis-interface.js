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

// Action liées aux éléments HTML

function c_reinit (vide=false)
{
	c_scenarii(get("scenarii"), true);
}

let manuel = null;
function c_manuel ()
{
	if (!manuel || manuel.closed)
		manuel = window.open("./manuel.html", "manuel", "scrollbars=yes");
	else
		manuel.focus();
}

function c_avancer ()
{
	avancer();
	get("reinit").disabled = false;
}

function c_simuler ()
{
	stop ^= true;

	if (stop)
		clearInterval(id);
	else
		id = setInterval(avancer, 1000/eps);

	get("simuler").innerHTML = stop ? "Avance rapide" : "Pause";
	get("reinit").disabled = false;
}

function c_zoom ()
{
	zoomer(vue.x + cadre.width/2, vue.y + cadre.height/2);
}

function c_vitesse (vit)
{
	eps = +vit.value;
	get("eps").innerHTML = eps+"/s";
	clearInterval(id);
	if (!stop)
		id = setInterval(c_avancer, 1000/eps);
}

function c_instructions (c)
{
	get("instructions").style.display = c.checked ? "" : "none";
	cadrer();
}

function c_colonie (c)
{
	get("colonie").style.display = c.checked ? "" : "none";
	cadrer();
}

function c_scenarii (c, reset=false)
{
	reinit();

	let scenar = c.options[c.selectedIndex].id;
	switch (scenar) {
	case "s_langton":
		ajouter_fourmi(0, 0, DH, 0xFF0000);
		break;

	case "s_ladanse":
		ajouter_fourmi(0, 0, DH, 0xFF0000);
		ajouter_fourmi(1, 0, DH, 0xFF0000);
		break;

	case "s_carreau":
		ajouter_fourmi(0, 0, DH, 0xFF0000);
		ajouter_fourmi(0, 1, DB, 0xFF0000);
		break;

	case "s_quatuor":
	case "s_symquad":
		ajouter_fourmi(1, 0, DH, 0xFF0000);
		ajouter_fourmi(0, 2, DG, 0xFF0000);
		ajouter_fourmi(2, 3, DB, 0xFF0000);
		ajouter_fourmi(3, 1, DD, 0xFF0000);
		break;

	case "s_symmetr":
		ajouter_fourmi(0, 0, DD);
		break;

	case "s_ftricol":
		ajouter_fourmi(0, 0);
		break;

	case "s_fbatiss":
		ajouter_fourmi( 0, 0, DH, 0x800000);
		break;

	case "s_fbharmo":
		ajouter_fourmi( 1, 0, DH, 0x800000);
		ajouter_fourmi( 3, 0, DH, 0x800000);
		ajouter_fourmi( 5, 0, DH, 0x800000);
		ajouter_fourmi( 7, 0, DH, 0x800000);
		ajouter_fourmi( 9, 0, DH, 0x800000);
		ajouter_fourmi(41, 0, DH, 0x800000);
		break;
		
	case "s_fbchaos":
		ajouter_fourmi( 1, 0, DH, 0x800000);
		ajouter_fourmi( 3, 0, DH, 0x800000);
		ajouter_fourmi( 5, 0, DH, 0x800000);
		ajouter_fourmi( 7, 0, DH, 0x800000);
		ajouter_fourmi( 9, 0, DH, 0x800000);
		ajouter_fourmi(42, 0, DH, 0xFF00FF);
		break;

	case "s_binaire":
	case "s_decimal":
		ajouter_fourmi(0, 0, DG, 0x808080);
		break;
	}

	if (!reset) {
		let npal = [], reprog = [];
		switch (scenar) {
		case "s_langton":
		case "s_ladanse":
		case "s_carreau":
		case "s_quatuor":
			reprog = [DG, DD];
			npal = [ 0xE0E0E0, 0x202020 ];
			break;
		case "s_ftricol":
			reprog = [DG, DH, DD];
			npal = [ 0xF0F0F0, 0xFF0000, 0x0000FF ];
			break;
		case "s_symmetr":
		case "s_symquad":
			reprog = [ DG, DD, DD, DG ];
			npal = [ 0xF0F0F0, 0x0000FF, 0x00B0B0, 0x00FF00 ];
			break;
		case "s_fbatiss":
		case "s_fbharmo":
		case "s_fbchaos":
			reprog = [ DG, DD, DD, DD, DD, DD, DG, DG, DD ];
			npal = [ 0xE0E0E0, 0xFF0000, 0xFF8000, 0xFFFF00, 0x00C000, 0x00FFFF, 0x0000FF, 0x800080, 0x202020 ];
			break;
		case "s_binaire":
			reprog = [ DG, DH ];
			npal = [ 0xE0E0E0, 0x000000 ];
			break;
		case "s_decimal":
			reprog = [ DG, DG, DG, DG, DG, DG, DG, DG, DG, DH ];
			npal = [ 0xE0E0E0, 0xFF0000, 0xFF8000, 0xFFFF00, 0x00C000, 0x00FFC0, 0x00C0FF, 0x0000FF, 0x800080, 0x000000 ];
			break;
		}
	
		get("cinstr").checked = !(reprog.length == 2 && reprog[0] == DG && reprog[1] == DD);
		c_instructions(get("cinstr"));
	
		get("ccol").checked = fourmis.length > 1;
		c_colonie(get("ccol"));
	
		nprog.splice(0, reprog.length, ...reprog);
		get("nbinstr").value = reprog.length;
		i_nbinstr();
		i_reprog();
	
		palette.splice(0, npal.length, ...npal);
		for (let i = 0 ; i < reprog.length ; ++i) {
			changer_couleur("i_"+i+"c", palette[i]);
			get("i_"+i+"d").innerHTML = DTXT[nprog[i]];
		}
	}

	repeindre();
}

function i_couleur (i)
{
	ouvrir_palette("i_"+i+"c", palette[i]);
}

const DTXT = [ "&#x2191;", "&#x21B0;", "&#x21B7;", "&#x21B1;" ];
function i_direct (i)
{
	nprog[i] = (nprog[i] + 1) % 4;
	get("i_"+i+"d").innerHTML = DTXT[nprog[i]];
	get("reprog").disabled = false;
}

function i_nbinstr ()
{
	let nbi = get("nbinstr").value;
	if (nbi <= 0 || nbi > IMAX) return;

	while (nnbi > nbi) {
		nnbi--;
		get("i_"+nnbi).remove();
	}

	while (nnbi < nbi) {
		get("instructions").insertAdjacentHTML("beforeend",
`<div id="i_`+nnbi+`" class="instruction">
	#`+nnbi+`
	<button id="i_`+nnbi+`c" onclick="i_couleur(`+nnbi+`)" title="Modifie la couleur d'affichage associée à cette instruction."></button> :
	<button id="i_`+nnbi+`d" onclick="i_direct(`+nnbi+`)" title="Rotation de la fourmi dans ce cas (aucune, à gauche, demi-tour, à droite)."></button>
</div>`);
		get("i_"+nnbi+"c").style.backgroundColor = "#"+hexcol(palette[nnbi]);
		get("i_"+nnbi+"d").innerHTML = DTXT[nprog[nnbi]];
		nnbi++;
	}
	get("reprog").disabled = false;
}

function i_reprog ()
{
	prog = nprog.slice(0, nnbi);
	get("reprog").disabled = true;
}

const OTXT = [ "&#x2191;", "&#x2190;", "&#x2193;", "&#x2192;" ];
let fdir = -1;
function f_dir()
{
	fdir = (fdir+1) % 4;
	get("fdir").innerHTML = OTXT[fdir];
}

let fcoul = 0x000000;
function f_coul ()
{
	ouvrir_palette("fcoul", fcoul);
}

function f_ajout ()
{
	let fx = do_clamp("fxpos"), fy = do_clamp("fypos");
	ajouter_fourmi(fx, fy, fdir, fcoul);
	repeindre_fourmis();
	get("reinit").disabled = false;
}

function f_centrer (idf)
{
	let f = fourmis.find( (f) => f.id == idf);

	vue.x = int(f.i * cote - cadre.width/2);
	vue.y = int(f.j * cote - cadre.height/2);

	repeindre();
}

function f_suppr (idf)
{
	fourmis.splice(fourmis.findIndex( (f) => f.id == idf ), 1);
	get("f_"+idf).remove();
	repeindre();
	get("reinit").disabled = false;
}

// Autres évènements (souris, fenêtre)

// Ajuste la taille du canevas pour occuper la place disponible dans la fenêtre.
function cadrer ()
{
	// NOTE: Pas une noop.
	cadre.width = 1;
	cadre.height = 1;
	cadre.width = cadre.offsetWidth;
	cadre.height = cadre.offsetHeight;

	toile.clearRect(0, 0, cadre.width, cadre.height);
	toile.strokeRect(0, 0, cadre.width, cadre.height);

	repeindre();
}

// Réagit au glisser-déplacer en faisant défiler la vue.
function glisser (e)
{
	if (e.type == "pointerdown")
		e.target.setPointerCapture(e.pointerId);

	if (e.target.hasPointerCapture(e.pointerId)) {
		vue.x -= e.movementX;
		vue.y -= e.movementY;
		repeindre();
	}
}

// Sélectionne les coordonnées pointées pour l'ajout d'une fourmi.
function viser (e)
{
	get("fxpos").value = int((vue.x + e.offsetX)/cote - grille.length/2);
	get("fypos").value = int((vue.y + e.offsetY)/cote - grille[0].length/2);
}

// Réagit à la molette de la souris par un zoom stratégique.
function zoom_strat (e)
{
	if (e.deltaY < 0)
		get("zoom").value++;
	else
		get("zoom").value--;

	zoomer(e.offsetX + vue.x, e.offsetY + vue.y);
}

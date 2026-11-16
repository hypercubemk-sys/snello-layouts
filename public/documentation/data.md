# Data layouts

Data is where you work with records. It does not edit the layout itself. To change columns, forms, or filters, use Layouts.

## Find a list

Open **Data** from Home or from the side menu. Every card is a list layout. The card shows the metadata icon and the metadata label.

Click **Filters** to narrow the cards:

- **Group** is the metadata group. Open the menu and type to narrow it. The metadata menu then lists only that group.
- **Metadata** is the table the list belongs to. Open the menu and type to narrow it.

Press Enter or the check button to apply. The panel closes and a chip shows the active filter. The X clears the group and the metadata and shows every list again.

## Open a list

Click anywhere on the card. The page title is the layout name. The line above it is the metadata and the page type.

The plus button starts a new record when this metadata has an edit layout. It opens in a window.

## Search the records

Click **Filters**. The fields are the searchable columns that are enabled in **Visible fields**. Hiding a column removes its filter. Custom filters stay in the list. A text search can be a contains match or an exact match. Dates can be a range. A number range is labeled **from** and **to**. Booleans are yes, no, or any. A select accepts several values. A join or a relationship opens a list: the check keeps only that record, and the flag adds it to the selection. Those lists show names, not identifiers.

The search does not start while you type. Press Enter or the check button. The panel closes and the list reloads. The X clears every field and loads the list without filters. Active filters stay visible as chips.

The sliders button, **Visible fields**, chooses which columns are shown. **Select all** and **Clear all** are in that menu. This choice is for the current list on this browser and does not change the layout.

## Sort and pages

A location column and a path column show a small map. The path map draws every point.

Click a column title to sort. Click it again to reverse the order. The arrow shows the direction.

The bar under the table moves between pages and changes how many rows are shown. The choices are 10, 20, and 50.

## Open a record

The icons on a row open the view or edit layout of the same metadata, in a window. The eye opens the view. The pencil opens the edit. Several windows can stay open together, side by side. Minimize sends a window to the bar at the bottom. The bar shows an E or V mark, the record name or key, a maximize icon, and a close icon. A metadata without those layouts has no row icons.

A view shows the values. An edit shows the form defined in the layout.

## Move through the form

The form can have more than one page. When it does, the line at the top shows the current step and the page title. A form with one page shows only the page title.

The left arrow goes to the previous page. It is disabled on the first page, and when the form has only one page. The right arrow goes to the next page. Required fields on the current page must be filled before you can leave it.

On an edit form, the check button saves the record. **Create** inserts a new record. **Update** writes the open record. If a required field is empty, the form stays on that page and nothing is sent.

The trash icon deletes the open record. It first asks **Delete?** Confirm with the check, or cancel with the X. A new record that has not been saved yet has no delete button.

**Show if** fields stay hidden until the linked field has a value. A checkbox counts as a value when it is checked. An empty text, an empty list, and a false checkbox do not.

On the last page, the code icon is **Source**. It shows the JSON of the record as it would be sent, including the fields placed on the layout. Press Source again to hide it.

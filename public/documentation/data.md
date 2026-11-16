# Data layouts

Data is where you work with records. It does not edit the layout itself. To change columns, forms, or filters, use Layouts.

## Find a list

Open **Data** from Home or from the side menu. Every card is a list layout. The card shows the metadata icon and the layout name.

Click **Filters** to narrow the cards:

- **Group** is the metadata group. The metadata menu then lists only that group.
- **Metadata** is the table the list belongs to.

Press Enter or the check button to apply. The panel closes and a chip shows the active filter. The X clears the group and the metadata and shows every list again.

## Open a list

Click anywhere on the card. The page title is the layout name. The line above it is the metadata and the page type.

The plus button starts a new record when this metadata has an edit layout. It opens on the side. The close icon, or a click outside the panel, returns to the list.

## Search the records

Click **Filters**. The fields are the ones marked searchable on the list layout. A text search can be a contains match or an exact match. Dates can be a range. A number range is labeled **from** and **to**. Booleans are yes, no, or any.

The search does not start while you type. Press Enter or the check button. The panel closes and the list reloads. The X clears every field and loads the list without filters. Active filters stay visible as chips.

The sliders button, **Visible fields**, chooses which columns are shown. **Select all** and **Clear all** are in that menu. This choice is for the current list on this browser and does not change the layout.

## Sort and pages

Click a column title to sort. Click it again to reverse the order. The arrow shows the direction.

The bar under the table moves between pages and changes how many rows are shown. The choices are 10, 20, and 50.

## Open a record

The icons on a row open the view or edit layout of the same metadata, in a side panel. The eye opens the view. The pencil opens the edit. A metadata without those layouts has no row icons.

A view shows the values. An edit shows the form defined in the layout.

## Move through the form

The form can have more than one page. The line at the top is the current step and the page title.

The left arrow goes to the previous page. It is disabled on the first page, and when the form has only one page. The right arrow goes to the next page. Required fields on the current page must be filled before you can leave it.

**Show if** fields stay hidden until the linked field has a value. A checkbox counts as a value when it is checked. An empty text, an empty list, and a false checkbox do not.

On an edit form, the code icon is **Source**. It shows the JSON of the record as it would be sent, including the fields placed on the layout. Press Source again to hide it.

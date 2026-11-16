# Layouts

Layouts are the pages used to list, edit, and view the records of a metadata. You build them in the library. You open the records from Data.

## The library

Open **Layouts** from Home or from the side menu. Each card is one saved layout.

The icon is the metadata. The letter in the black circle is the page type: **L** list, **E** edit, **V** view. The date is the last time the layout was saved.

The pencil opens the editor. The copy icon clones the layout. The trash icon asks **Delete?** before it removes the layout. Confirm with the check, or cancel with the X.

## Find a layout

Click the **Filters** area to open it. You can narrow the library by:

- **Name**, a contains search
- **Group**, the metadata group
- **Metadata**
- **Type**: list, edit, or view

Choosing a group limits the metadata list to that group. The search starts when you press Enter or the check button, and the panel closes. The X clears every filter and shows the full library again. Applied filters stay visible as chips while the panel is closed.

## Create a layout

Use the plus button. Choose a metadata. The app prepares three drafts from every field of that metadata: list, edit, and view. Turn off a draft you do not need, rename the ones you keep, then press the check button.

A new list shows every field, with a search mode that matches the field type. A new edit or view layout has one page, **Page 1**, and one block, **Details**. Text fields take the full row. The other fields take a third of the row. Required follows the metadata.

If a list, edit, or view already exists for that metadata, its name is shown under the drafts. Creating again adds another layout.

## Create many layouts

The layers button opens **Create many layouts**. Tick the metadata you want, or use **Select all** and **Clear all**. Tick **List**, **Edit**, and **View** for the page types you want, then press the check button.

A metadata that already has that page type is skipped. Names follow the table name: `list`, `edit`, and `view`.

## Edit a list

Open a list layout with the pencil. **Columns** is the field list.

- The checkbox shows or hides the column.
- The menu beside a field is how that column is searched: Like, Equals, Range, Boolean, or None. Images are not searchable.
- The arrows change the column order.

Fields on the left add or remove a column. Changing the metadata, or switching between a list and a form, rebuilds the layout. The page asks you to confirm first.

Press the check button in the page header to save.

## Edit a form

An edit or view layout is made of pages and blocks.

- **Add page** starts a new step. Rename it in the title field. The trash icon deletes the page.
- **Add block** adds a group inside the selected page. Rename or delete a block from its header.
- Click a field on the left to place it in the selected block. Click it again in the block to remove it. A field can sit in only one block.

On each field:

- **Required** is available on edit layouts. A view layout does not show it.
- **Show if** hides the field until another field has a value. Choose that field in the menu that appears.
- **Full**, **Half**, and **Third** set the width.
- The arrows move the field. The minus removes it.

Save with the check button in the page header. On an edit layout, **Update the view too** copies the pages, blocks, and fields onto every view of the same metadata. It is shown only when that view already exists.

## Custom filters

On a list layout, **Custom filters** sits under Columns. The plus button adds a filter. Each filter has a **Label**, a **Type** (String, Boolean, Date, or Numeric), and a **Mode**.

**Column conditions** apply the filter to one or more fields. Pick the field and the condition. **Entered** uses the value typed later in the filter. **Fixed** stores a value now. Conditions such as empty or null do not ask for a value.

**Developer** stores a parameter name and one REST condition. The info icon lists every condition, with the suffix, the SQL, and a short note.

Remove a filter or a condition with the trash or minus icon. Save the layout with the check button.

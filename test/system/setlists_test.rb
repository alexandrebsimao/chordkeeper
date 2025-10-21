require "application_system_test_case"

class SetlistsTest < ApplicationSystemTestCase
  setup do
    @setlist = setlists(:one)
  end

  test "visiting the index" do
    visit setlists_url
    assert_selector "h1", text: "Setlists"
  end

  test "should create setlist" do
    visit setlists_url
    click_on "New setlist"

    fill_in "Description", with: @setlist.description
    fill_in "Library", with: @setlist.library_id
    fill_in "Name", with: @setlist.name
    click_on "Create Setlist"

    assert_text "Setlist was successfully created"
    click_on "Back"
  end

  test "should update Setlist" do
    visit setlist_url(@setlist)
    click_on "Edit this setlist", match: :first

    fill_in "Description", with: @setlist.description
    fill_in "Library", with: @setlist.library_id
    fill_in "Name", with: @setlist.name
    click_on "Update Setlist"

    assert_text "Setlist was successfully updated"
    click_on "Back"
  end

  test "should destroy Setlist" do
    visit setlist_url(@setlist)
    click_on "Destroy this setlist", match: :first

    assert_text "Setlist was successfully destroyed"
  end
end

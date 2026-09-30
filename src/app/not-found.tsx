import ShopLayout from "./(shop)/layout";
import ShopNotFound from "./(shop)/not-found";

// Unknown URLs only get the root layout, so wrap the shop's 404 in the shop frame (header, dock, footer).
export default function NotFound() {
  return (
    <ShopLayout params={Promise.resolve({})}>
      <ShopNotFound />
    </ShopLayout>
  );
}

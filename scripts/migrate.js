const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure public uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Function to read .env.local manually since dotenv is not in dependencies
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const env = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || '';
        // Remove quotes
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[match[1]] = value.trim();
      }
    });
  }
  return env;
}

const env = loadEnv();
const domain = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;

async function fetchShopifyData() {
  if (!domain || !token) {
    console.warn("Shopify credentials not found. Seeding with fallback data...");
    seedFallbackData();
    return;
  }

  console.log(`Connecting to Shopify Store: ${domain}...`);
  const endpoint = `${domain}/api/2024-04/graphql.json`;

  const query = `
    query {
      collections(first: 50) {
        edges {
          node {
            id
            title
            handle
            description
            image {
              url
              altText
            }
          }
        }
      }
      products(first: 100) {
        edges {
          node {
            id
            title
            handle
            description
            descriptionHtml
            availableForSale
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            compareAtPriceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 10) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            options(first: 3) {
              name
              values
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                  image {
                    url
                  }
                }
              }
            }
            tags
            collections(first: 10) {
              edges {
                node {
                  handle
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      throw new Error(`Shopify API responded with status: ${res.status}`);
    }

    const body = await res.json();
    if (body.errors) {
      throw new Error(JSON.stringify(body.errors));
    }

    const collections = body.data.collections.edges.map(e => e.node);
    const products = body.data.products.edges.map(e => {
      const p = e.node;
      // Extract collection handles
      p.collectionHandles = p.collections.edges.map(ce => ce.node.handle);
      return p;
    });

    console.log(`Successfully fetched ${collections.length} collections and ${products.length} products!`);

    fs.writeFileSync(path.join(dataDir, 'collections.json'), JSON.stringify(collections, null, 2));
    fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2));
    seedDefaults();
    console.log("Migration complete!");
  } catch (error) {
    console.error("Failed to migrate data from Shopify:", error);
    console.log("Seeding with fallback data instead...");
    seedFallbackData();
  }
}

function seedDefaults() {
  // Create default admin user if not exists
  const adminFile = path.join(dataDir, 'admin.json');
  if (!fs.existsSync(adminFile)) {
    const defaultAdmin = {
      username: "admin",
      // admin123 hashed via sha256
      passwordHash: "240789146b148e658ec6a836cb1a8ff0cf99c35b8cb40ff71fe89a243007018c", // sha256 of "admin123"
      name: "Boutiique Admin"
    };
    fs.writeFileSync(adminFile, JSON.stringify([defaultAdmin], null, 2));
  }

  // Create empty users, orders, carts files if they don't exist
  if (!fs.existsSync(path.join(dataDir, 'users.json'))) {
    fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(path.join(dataDir, 'orders.json'))) {
    fs.writeFileSync(path.join(dataDir, 'orders.json'), JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(path.join(dataDir, 'carts.json'))) {
    fs.writeFileSync(path.join(dataDir, 'carts.json'), JSON.stringify({}, null, 2));
  }
}

function seedFallbackData() {
  const collections = [
    {
      id: "gid://shopify/Collection/1",
      title: "Banarasi Silks",
      handle: "banarasi-silks",
      description: "Lustrous silks woven with metallic gold and silver threads, featuring intricate brocades and floral motifs.",
      image: {
        url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
        altText: "Banarasi Silks"
      }
    },
    {
      id: "gid://shopify/Collection/2",
      title: "Linen Sarees",
      handle: "linen-sarees",
      description: "Lightweight, breathable linen sarees ideal for tropical climates, blending comfort with timeless elegance.",
      image: {
        url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
        altText: "Linen Sarees"
      }
    },
    {
      id: "gid://shopify/Collection/3",
      title: "Designer Kurtis",
      handle: "designer-kurtis",
      description: "Chic, everyday designer kurtis featuring handblock prints, minimal embroidery, and modern silhouettes.",
      image: {
        url: "https://images.unsplash.com/photo-1608748010899-18f300247112?w=600&auto=format&fit=crop&q=80",
        altText: "Designer Kurtis"
      }
    },
    {
      id: "gid://shopify/Collection/4",
      title: "Organza Sarees",
      handle: "organza-sarees",
      description: "Sheer, crisp, and ethereal organza sarees with delicate hand-painted motifs and scalloped borders.",
      image: {
        url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
        altText: "Organza Sarees"
      }
    }
  ];

  const products = [
    {
      id: "gid://shopify/Product/1",
      title: "Royal Crimson Banarasi Katan Silk Saree",
      handle: "royal-crimson-banarasi-katan-silk-saree",
      description: "Woven in the heart of Varanasi, this royal crimson saree features fine Katan silk with pure gold zari brocade work. Perfect for bridal and grand festive occasions.",
      descriptionHtml: "<p>Woven in the heart of Varanasi, this royal crimson saree features fine Katan silk with pure gold zari brocade work. Perfect for bridal and grand festive occasions.</p><p><strong>Specifications:</strong></p><ul><li>Fabric: 100% Pure Katan Silk</li><li>Zari: Tested Metallic Gold Zari</li><li>Length: 5.5 meters + 80 cm blouse piece</li><li>Care: Dry Clean Only</li></ul>",
      availableForSale: true,
      priceRange: {
        minVariantPrice: {
          amount: "18500.00",
          currencyCode: "INR"
        }
      },
      compareAtPriceRange: {
        minVariantPrice: {
          amount: "24500.00",
          currencyCode: "INR"
        }
      },
      images: {
        edges: [
          {
            node: {
              url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
              altText: "Royal Crimson Banarasi Saree Close-up"
            }
          },
          {
            node: {
              url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
              altText: "Royal Crimson Banarasi Saree Drape"
            }
          }
        ]
      },
      options: [
        {
          name: "Blouse Stitching",
          values: ["Unstitched Blouse Piece", "Stitched Standard Size", "Custom Fit"]
        }
      ],
      variants: {
        edges: [
          {
            node: {
              id: "gid://shopify/ProductVariant/101",
              title: "Unstitched Blouse Piece",
              availableForSale: true,
              price: {
                amount: "18500.00",
                currencyCode: "INR"
              },
              compareAtPrice: {
                amount: "24500.00",
                currencyCode: "INR"
              },
              selectedOptions: [
                {
                  name: "Blouse Stitching",
                  value: "Unstitched Blouse Piece"
                }
              ]
            }
          },
          {
            node: {
              id: "gid://shopify/ProductVariant/102",
              title: "Stitched Standard Size",
              availableForSale: true,
              price: {
                amount: "19500.00",
                currencyCode: "INR"
              },
              compareAtPrice: {
                amount: "25500.00",
                currencyCode: "INR"
              },
              selectedOptions: [
                {
                  name: "Blouse Stitching",
                  value: "Stitched Standard Size"
                }
              ]
            }
          },
          {
            node: {
              id: "gid://shopify/ProductVariant/103",
              title: "Custom Fit",
              availableForSale: true,
              price: {
                amount: "20500.00",
                currencyCode: "INR"
              },
              compareAtPrice: {
                amount: "26500.00",
                currencyCode: "INR"
              },
              selectedOptions: [
                {
                  name: "Blouse Stitching",
                  value: "Custom Fit"
                }
              ]
            }
          }
        ]
      },
      tags: ["Bridal", "Silk", "Banarasi", "Bestseller"],
      collectionHandles: ["banarasi-silks"],
      inventory: 8
    },
    {
      id: "gid://shopify/Product/2",
      title: "Mint Sage Hand-Painted Organza Saree",
      handle: "mint-sage-hand-painted-organza-saree",
      description: "Ethereal mint sage organza saree adorned with delicate, hand-painted blush rose motifs and completed with an elegant scalloped border.",
      descriptionHtml: "<p>Ethereal mint sage organza saree adorned with delicate, hand-painted blush rose motifs and completed with an elegant scalloped border.</p><ul><li>Fabric: Premium Glass Organza</li><li>Art: Hand-painted by artisans in Rajasthan</li><li>Includes: Unstitched satin blouse fabric</li><li>Care: Dry clean only</li></ul>",
      availableForSale: true,
      priceRange: {
        minVariantPrice: {
          amount: "4800.00",
          currencyCode: "INR"
        }
      },
      compareAtPriceRange: {
        minVariantPrice: {
          amount: "6200.00",
          currencyCode: "INR"
        }
      },
      images: {
        edges: [
          {
            node: {
              url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
              altText: "Mint Sage Organza Saree"
            }
          }
        ]
      },
      options: [
        {
          name: "Standard",
          values: ["Default Title"]
        }
      ],
      variants: {
        edges: [
          {
            node: {
              id: "gid://shopify/ProductVariant/201",
              title: "Default Title",
              availableForSale: true,
              price: {
                amount: "4800.00",
                currencyCode: "INR"
              },
              compareAtPrice: {
                amount: "6200.00",
                currencyCode: "INR"
              },
              selectedOptions: [
                {
                  name: "Standard",
                  value: "Default Title"
                }
              ]
            }
          }
        ]
      },
      tags: ["Organza", "Handpainted", "Floral", "Summer"],
      collectionHandles: ["organza-sarees"],
      inventory: 15
    },
    {
      id: "gid://shopify/Product/3",
      title: "Indigo Khadi Linen Saree with Silver Borders",
      handle: "indigo-khadi-linen-saree-with-silver-borders",
      description: "Comfort meets classic styling in this Indigo handloom Khadi linen saree, featuring elegant silver zari borders and a striped pallu.",
      descriptionHtml: "<p>Comfort meets classic styling in this Indigo handloom Khadi linen saree, featuring elegant silver zari borders and a striped pallu.</p><ul><li>Fabric: Organic Linen blend</li><li>Weave: Handloom Khadi</li><li>Length: 6.2 meters (includes blouse)</li></ul>",
      availableForSale: true,
      priceRange: {
        minVariantPrice: {
          amount: "3200.00",
          currencyCode: "INR"
        }
      },
      compareAtPriceRange: {
        minVariantPrice: {
          amount: "4500.00",
          currencyCode: "INR"
        }
      },
      images: {
        edges: [
          {
            node: {
              url: "https://images.unsplash.com/photo-1608748010899-18f300247112?w=800&auto=format&fit=crop&q=80",
              altText: "Indigo Khadi Linen Saree"
            }
          }
        ]
      },
      options: [
        {
          name: "Standard",
          values: ["Default Title"]
        }
      ],
      variants: {
        edges: [
          {
            node: {
              id: "gid://shopify/ProductVariant/301",
              title: "Default Title",
              availableForSale: true,
              price: {
                amount: "3200.00",
                currencyCode: "INR"
              },
              compareAtPrice: {
                amount: "4500.00",
                currencyCode: "INR"
              },
              selectedOptions: [
                {
                  name: "Standard",
                  value: "Default Title"
                }
              ]
            }
          }
        ]
      },
      tags: ["Linen", "Handloom", "Khadi", "Indigo"],
      collectionHandles: ["linen-sarees"],
      inventory: 4
    },
    {
      id: "gid://shopify/Product/4",
      title: "Anarkali Handblock Printed Cotton Kurti",
      handle: "anarkali-handblock-printed-cotton-kurti",
      description: "A gorgeous, floor-length cotton Kurti featuring traditional Bagru handblock printing, a flared skirt, and delicate gotta patti embellishments around the neckline.",
      descriptionHtml: "<p>A gorgeous, floor-length cotton Kurti featuring traditional Bagru handblock printing, a flared skirt, and delicate gotta patti embellishments around the neckline.</p><ul><li>Fabric: 100% Breathable Cotton</li><li>Length: 48 inches</li><li>Style: Flared Anarkali</li></ul>",
      availableForSale: true,
      priceRange: {
        minVariantPrice: {
          amount: "1850.00",
          currencyCode: "INR"
        }
      },
      compareAtPriceRange: {
        minVariantPrice: {
          amount: "2600.00",
          currencyCode: "INR"
        }
      },
      images: {
        edges: [
          {
            node: {
              url: "https://images.unsplash.com/photo-1608748010899-18f300247112?w=800&auto=format&fit=crop&q=80",
              altText: "Handblock Printed Kurti"
            }
          }
        ]
      },
      options: [
        {
          name: "Size",
          values: ["S", "M", "L", "XL"]
        }
      ],
      variants: {
        edges: [
          {
            node: {
              id: "gid://shopify/ProductVariant/401",
              title: "S",
              availableForSale: true,
              price: {
                amount: "1850.00",
                currencyCode: "INR"
              },
              compareAtPrice: {
                amount: "2600.00",
                currencyCode: "INR"
              },
              selectedOptions: [
                {
                  name: "Size",
                  value: "S"
                }
              ]
            }
          },
          {
            node: {
              id: "gid://shopify/ProductVariant/402",
              title: "M",
              availableForSale: true,
              price: {
                amount: "1850.00",
                currencyCode: "INR"
              },
              compareAtPrice: {
                amount: "2600.00",
                currencyCode: "INR"
              },
              selectedOptions: [
                {
                  name: "Size",
                  value: "M"
                }
              ]
            }
          },
          {
            node: {
              id: "gid://shopify/ProductVariant/403",
              title: "L",
              availableForSale: true,
              price: {
                amount: "1850.00",
                currencyCode: "INR"
              },
              compareAtPrice: {
                amount: "2600.00",
                currencyCode: "INR"
              },
              selectedOptions: [
                {
                  name: "Size",
                  value: "L"
                }
              ]
            }
          },
          {
            node: {
              id: "gid://shopify/ProductVariant/404",
              title: "XL",
              availableForSale: true,
              price: {
                amount: "1850.00",
                currencyCode: "INR"
              },
              compareAtPrice: {
                amount: "2600.00",
                currencyCode: "INR"
              },
              selectedOptions: [
                {
                  name: "Size",
                  value: "XL"
                }
              ]
            }
          }
        ]
      },
      tags: ["Kurti", "Cotton", "Blockprint", "Anarkali"],
      collectionHandles: ["designer-kurtis"],
      inventory: 20
    }
  ];

  fs.writeFileSync(path.join(dataDir, 'collections.json'), JSON.stringify(collections, null, 2));
  fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2));
  seedDefaults();
  console.log("Fallback seeding complete!");
}

fetchShopifyData();

"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";

export default function ColorPalettePage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <PageHeader
        title="🎨 Bảng Màu Farm2Art"
        subtitle="Phối màu chủ đề nông trại - thiên nhiên - tái chế"
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Primary Colors */}
          <section>
            <h2 className="mb-6 text-3xl font-bold text-amber-900">🟢 Màu Chủ Đề Chính</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Emerald Green */}
              <Card>
                <div className="bg-emerald-500 h-48 rounded-t-lg" />
                <CardBody>
                  <h3 className="font-bold text-emerald-700 text-lg">Emerald Green</h3>
                  <p className="text-sm text-stone-600 mt-2">#10B981 / emerald-500</p>
                  <p className="text-xs text-stone-500 mt-1">Tái chế, Thiên nhiên, Sống xanh</p>
                  <Button variant="primary" className="mt-4 w-full">Button Primary</Button>
                </CardBody>
              </Card>

              {/* Dark Emerald */}
              <Card>
                <div className="bg-emerald-600 h-48 rounded-t-lg" />
                <CardBody>
                  <h3 className="font-bold text-emerald-700 text-lg">Dark Emerald</h3>
                  <p className="text-sm text-stone-600 mt-2">#059669 / emerald-600</p>
                  <p className="text-xs text-stone-500 mt-1">Hover, Active state</p>
                  <div className="mt-4 h-10 bg-emerald-600 rounded" />
                </CardBody>
              </Card>

              {/* Earth Brown */}
              <Card>
                <div className="bg-amber-800 h-48 rounded-t-lg" />
                <CardBody>
                  <h3 className="font-bold text-amber-900 text-lg">Earth Brown</h3>
                  <p className="text-sm text-stone-600 mt-2">#92400E / amber-800</p>
                  <p className="text-xs text-stone-500 mt-1">Đất, Nông sản, Nông trại</p>
                  <h1 className="mt-4 text-2xl font-bold text-amber-900">Heading</h1>
                </CardBody>
              </Card>
            </div>
          </section>

          {/* Accent Colors */}
          <section>
            <h2 className="mb-6 text-3xl font-bold text-amber-900">🔶 Màu Nhấn</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Golden Yellow */}
              <Card>
                <div className="bg-amber-400 h-48 rounded-t-lg" />
                <CardBody>
                  <h3 className="font-bold text-amber-800 text-lg">Golden Yellow</h3>
                  <p className="text-sm text-stone-600 mt-2">#FBBF24 / amber-400</p>
                  <p className="text-xs text-stone-500 mt-1">Nắng, Lúa mì, Highlights</p>
                  <Button variant="golden" className="mt-4 w-full">Special Button</Button>
                </CardBody>
              </Card>

              {/* Sage Green */}
              <Card>
                <div className="bg-sage-700 h-48 rounded-t-lg" />
                <CardBody>
                  <h3 className="font-bold text-sage-800 text-lg">Sage Green</h3>
                  <p className="text-sm text-stone-600 mt-2">#6B7D50 / sage-700</p>
                  <p className="text-xs text-stone-500 mt-1">Cây trồng, Bền vững</p>
                  <div className="mt-4 px-3 py-2 bg-sage-100 border border-sage-200 rounded text-sage-700 text-sm font-semibold">Badge</div>
                </CardBody>
              </Card>

              {/* Warm Orange */}
              <Card>
                <div className="bg-orange-500 h-48 rounded-t-lg" />
                <CardBody>
                  <h3 className="font-bold text-orange-700 text-lg">Warm Orange</h3>
                  <p className="text-sm text-stone-600 mt-2">#FF9500 / orange-500</p>
                  <p className="text-xs text-stone-500 mt-1">Năng lượng, Tối ưu</p>
                  <span className="inline-block mt-4 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">Price Tag</span>
                </CardBody>
              </Card>
            </div>
          </section>

          {/* Neutral Colors */}
          <section>
            <h2 className="mb-6 text-3xl font-bold text-amber-900">⚪ Màu Trung Tính</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Cream */}
              <Card>
                <div className="bg-cream-50 h-40 rounded-t-lg border-b border-sage-200" />
                <CardBody>
                  <h3 className="font-bold text-stone-900 text-lg">Cream</h3>
                  <p className="text-sm text-stone-600 mt-2">#FEFCE8 / cream-50</p>
                  <p className="text-xs text-stone-500 mt-1">Main background</p>
                </CardBody>
              </Card>

              {/* Light Gray */}
              <Card>
                <div className="bg-stone-100 h-40 rounded-t-lg" />
                <CardBody>
                  <h3 className="font-bold text-stone-900 text-lg">Light Gray</h3>
                  <p className="text-sm text-stone-600 mt-2">#F5F5F4 / stone-100</p>
                  <p className="text-xs text-stone-500 mt-1">Secondary BG</p>
                </CardBody>
              </Card>

              {/* Stone Gray */}
              <Card>
                <div className="bg-stone-600 h-40 rounded-t-lg" />
                <CardBody>
                  <h3 className="font-bold text-stone-900 text-lg">Stone Gray</h3>
                  <p className="text-sm text-stone-600 mt-2">#78716C / stone-600</p>
                  <p className="text-xs text-stone-500 mt-1">Body text</p>
                </CardBody>
              </Card>

              {/* Dark Stone */}
              <Card>
                <div className="bg-stone-900 h-40 rounded-t-lg" />
                <CardBody>
                  <h3 className="font-bold text-stone-900 text-lg">Dark Stone</h3>
                  <p className="text-sm text-stone-600 mt-2">#292524 / stone-900</p>
                  <p className="text-xs text-stone-500 mt-1">Dark headings</p>
                </CardBody>
              </Card>
            </div>
          </section>

          {/* Semantic Colors */}
          <section>
            <h2 className="mb-6 text-3xl font-bold text-amber-900">📊 Màu Trạng Thái</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Success */}
              <Card>
                <div className="bg-emerald-500 h-40 rounded-t-lg flex items-center justify-center">
                  <span className="text-white text-4xl">✅</span>
                </div>
                <CardBody>
                  <h3 className="font-bold text-emerald-700 text-lg">Success</h3>
                  <p className="text-sm text-stone-600 mt-2">Emerald-500</p>
                  <p className="text-xs text-stone-500 mt-1">Hành động thành công</p>
                </CardBody>
              </Card>

              {/* Warning */}
              <Card>
                <div className="bg-amber-400 h-40 rounded-t-lg flex items-center justify-center">
                  <span className="text-amber-900 text-4xl">⚠️</span>
                </div>
                <CardBody>
                  <h3 className="font-bold text-amber-800 text-lg">Warning</h3>
                  <p className="text-sm text-stone-600 mt-2">Amber-400</p>
                  <p className="text-xs text-stone-500 mt-1">Cảnh báo, chú ý</p>
                </CardBody>
              </Card>

              {/* Error */}
              <Card>
                <div className="bg-red-500 h-40 rounded-t-lg flex items-center justify-center">
                  <span className="text-white text-4xl">❌</span>
                </div>
                <CardBody>
                  <h3 className="font-bold text-red-700 text-lg">Error</h3>
                  <p className="text-sm text-stone-600 mt-2">Red-500</p>
                  <p className="text-xs text-stone-500 mt-1">Lỗi, thất bại</p>
                </CardBody>
              </Card>

              {/* Info */}
              <Card>
                <div className="bg-emerald-500 h-40 rounded-t-lg flex items-center justify-center">
                  <span className="text-white text-4xl">ℹ️</span>
                </div>
                <CardBody>
                  <h3 className="font-bold text-emerald-700 text-lg">Info</h3>
                  <p className="text-sm text-stone-600 mt-2">Blue-500</p>
                  <p className="text-xs text-stone-500 mt-1">Thông tin bổ sung</p>
                </CardBody>
              </Card>
            </div>
          </section>

          {/* Usage Examples */}
          <section>
            <h2 className="mb-6 text-3xl font-bold text-amber-900">💡 Ví Dụ Sử Dụng</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Buttons */}
              <Card>
                <CardBody>
                  <h3 className="font-bold text-amber-900 text-lg mb-4">Buttons</h3>
                  <div className="space-y-3">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="golden">Golden Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                  </div>
                </CardBody>
              </Card>

              {/* Badges & Tags */}
              <Card>
                <CardBody>
                  <h3 className="font-bold text-amber-900 text-lg mb-4">Badges & Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">✅ Active</span>
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">⚠️ Pending</span>
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">❌ Inactive</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">ℹ️ Info</span>
                    <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-700 text-xs font-semibold">🌱 Featured</span>
                  </div>
                </CardBody>
              </Card>

              {/* Text Variations */}
              <Card className="lg:col-span-2">
                <CardBody>
                  <h3 className="font-bold text-amber-900 text-lg mb-4">Text Variations</h3>
                  <h1 className="text-4xl font-bold text-amber-900 mb-2">Heading 1 (amber-900)</h1>
                  <h2 className="text-2xl font-bold text-emerald-700 mb-2">Heading 2 (emerald-700)</h2>
                  <p className="text-base text-stone-700 mb-2">Body text (stone-700) - Đây là các văn bản thân thể được sử dụng trong các nội dung chính của trang web.</p>
                  <p className="text-sm text-stone-600 mb-2">Secondary text (stone-600) - Các thông tin bổ sung hoặc nhỏ hơn.</p>
                  <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold">Link text (emerald-600)</a>
                </CardBody>
              </Card>
            </div>
          </section>

          {/* Color Guidelines */}
          <section>
            <Card className="border-l-4 border-emerald-500 bg-emerald-50">
              <CardBody>
                <h3 className="font-bold text-emerald-900 text-lg mb-3">📋 Hướng Dẫn Sử Dụng</h3>
                <ul className="space-y-2 text-sm text-stone-700">
                  <li>✅ <strong>Primary Actions:</strong> Sử dụng Emerald Green (#10B981) cho buttons chính và CTAs</li>
                  <li>✅ <strong>Headings:</strong> Sử dụng Earth Brown (#92400E) cho tiêu đề chính, Dark Stone (#292524) cho tiêu đề phụ</li>
                  <li>✅ <strong>Body Text:</strong> Sử dụng Stone Gray (#78716C) cho nội dung chính</li>
                  <li>✅ <strong>Backgrounds:</strong> Sử dụng Cream (#FEFCE8) cho main background, Stone-100 cho secondary</li>
                  <li>✅ <strong>Accents:</strong> Sử dụng Golden Yellow (#FBBF24) cho highlights và special items</li>
                  <li>✅ <strong>Borders:</strong> Sử dụng Sage Green (#6B7D50) cho borders và dividers</li>
                </ul>
              </CardBody>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

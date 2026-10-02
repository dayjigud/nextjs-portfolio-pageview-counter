import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../app/runtime.dart';
import '../core/models.dart';
import '../core/money.dart';
import '../features/auth/auth_controller.dart';

const demoNotice = 'Portfolio demo — no payment or shipment.';
Future<void> action(
  BuildContext context,
  Future<void> Function() operation,
) async {
  try {
    await operation();
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }
}

Widget message(String title, {VoidCallback? retry}) => Center(
  child: Padding(
    padding: const EdgeInsets.all(24),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(title, textAlign: TextAlign.center),
        if (retry != null)
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: FilledButton(
              onPressed: retry,
              child: const Text('Try again'),
            ),
          ),
      ],
    ),
  ),
);

class LumaShell extends StatelessWidget {
  final AppRuntime runtime;
  final String route;
  final Widget child;
  const LumaShell({
    super.key,
    required this.runtime,
    required this.route,
    required this.child,
  });
  @override
  Widget build(BuildContext context) {
    final index = route == '/cart' || route == '/checkout'
        ? 1
        : route.startsWith('/account') ||
              route.startsWith('/receipt') ||
              route == '/signin'
        ? 2
        : 0;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Luma Shop'),
        leading: route == '/'
            ? null
            : IconButton(
                icon: const Icon(Icons.arrow_back),
                tooltip: 'Back to collection',
                onPressed: () => context.go('/'),
              ),
      ),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text(
              demoNotice,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12),
            ),
          ),
          if (runtime.error != null)
            MaterialBanner(
              content: Text(runtime.error!),
              actions: [
                TextButton(
                  onPressed: () => action(context, runtime.initialize),
                  child: const Text('Retry'),
                ),
              ],
            ),
          Expanded(
            child: !runtime.config.isConfigured
                ? message('The shop is not connected yet.')
                : !runtime.ready
                ? message('Connecting your good things…')
                : child,
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => action(context, () async {
          await runtime.cart?.flushPending();
          if (context.mounted) context.go(['/', '/cart', '/account'][value]);
        }),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.auto_awesome_outlined),
            label: 'Collection',
          ),
          NavigationDestination(
            icon: Badge(
              label: Text('${runtime.cart?.badgeQuantity ?? 0}'),
              isLabelVisible: (runtime.cart?.badgeQuantity ?? 0) > 0,
              child: const Icon(Icons.shopping_bag_outlined),
            ),
            label: 'Bag',
          ),
          const NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}

class ProductArt extends StatelessWidget {
  final AppRuntime runtime;
  final Product product;
  const ProductArt(this.runtime, this.product, {super.key});
  @override
  Widget build(BuildContext context) {
    if (product.images.isEmpty) {
      return const Center(
        child: Icon(Icons.auto_awesome, size: 72, color: Color(0xFF7658D9)),
      );
    }
    final image = product.images.first;
    final uri = Uri.tryParse(image.path);
    final fallback = uri?.path.split('/').last ?? '';
    final url = runtime.client!.storage
        .from('luma-catalog')
        .getPublicUrl(image.path);
    Widget failed() => RegExp(r'^[a-z0-9-]+\.svg$').hasMatch(fallback)
        ? SvgPicture.asset(
            'assets/images/luma/$fallback',
            semanticsLabel: image.alt.isEmpty ? product.name : image.alt,
            errorBuilder: (context, error, stack) =>
                const Icon(Icons.image_not_supported_outlined),
          )
        : const Icon(Icons.image_not_supported_outlined);
    return image.path.endsWith('.svg')
        ? SvgPicture.network(
            url,
            semanticsLabel: image.alt.isEmpty ? product.name : image.alt,
            placeholderBuilder: (_) =>
                const Center(child: CircularProgressIndicator()),
            errorBuilder: (context, error, stack) => failed(),
          )
        : Image.network(
            url,
            semanticLabel: product.name,
            errorBuilder: (context, error, stack) => failed(),
          );
  }
}

class CatalogScreen extends StatefulWidget {
  final AppRuntime runtime;
  const CatalogScreen(this.runtime, {super.key});
  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  Future<List<Product>>? _products;
  String query = '', category = '';
  int _catalogGeneration = -1;
  @override
  Widget build(BuildContext context) {
    if (_catalogGeneration != widget.runtime.catalogGeneration) {
      _catalogGeneration = widget.runtime.catalogGeneration;
      _products = widget.runtime.catalog?.load();
    }
    _products ??= widget.runtime.catalog?.load();
    return FutureBuilder<List<Product>>(
      future: _products,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return message(
            'Products could not load. Please retry.',
            retry: () => setState(
              () =>
                  _products = widget.runtime.catalog!.load(forceRefresh: true),
            ),
          );
        }
        if (!snapshot.hasData) return message('Finding your next favorite…');
        final products = widget.runtime.catalog!.search(
          products: snapshot.data!,
          query: query,
          category: category,
        );
        return RefreshIndicator(
          onRefresh: () async {
            final next = widget.runtime.catalog!.load(forceRefresh: true);
            setState(() => _products = next);
            await next;
          },
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Text(
                'GOOD TECH. GREAT ENERGY.',
                style: TextStyle(
                  letterSpacing: 2,
                  fontSize: 12,
                  color: Color(0xFF7658D9),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Meet your next\nfavorite.',
                style: Theme.of(context).textTheme.displaySmall
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  'A little color. A little clever. Good things for your everyday.',
                ),
              ),
              TextField(
                decoration: const InputDecoration(
                  labelText: 'Search the collection',
                  prefixIcon: Icon(Icons.search),
                ),
                onChanged: (value) => setState(() => query = value),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  for (final value in [
                    '',
                    ...snapshot.data!.map((p) => p.categorySlug).toSet(),
                  ])
                    ChoiceChip(
                      label: Text(value.isEmpty ? 'All finds' : value),
                      selected: category == value,
                      onSelected: (_) => setState(() => category = value),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              if (products.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('No finds match your search.'),
                ),
              for (final product in products)
                Card(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(24),
                    onTap: () => context.go('/product/${product.slug}'),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            height: 180,
                            width: double.infinity,
                            child: ProductArt(widget.runtime, product),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            product.categorySlug.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF7658D9),
                            ),
                          ),
                          Text(
                            product.name,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          Text(product.description),
                          const SizedBox(height: 12),
                          if (product.variants.isNotEmpty)
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    money(product.variants.first.priceKobo),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  tooltip: 'Add ${product.name} to bag',
                                  icon: const Icon(Icons.add_circle_outline),
                                  onPressed: () => action(context, () async {
                                    await widget.runtime.cart!.add(
                                      product.variants.first.id,
                                    );
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text('Added to your bag.'),
                                        ),
                                      );
                                    }
                                  }),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class ProductScreen extends StatefulWidget {
  final AppRuntime runtime;
  final String slug;
  const ProductScreen(this.runtime, this.slug, {super.key});
  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  Future<Product?>? _product;
  String? variant;
  int quantity = 1;
  bool busy = false;
  @override
  Widget build(BuildContext context) {
    _product ??= widget.runtime.catalog?.findBySlug(widget.slug);
    return FutureBuilder<Product?>(
      future: _product,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return message(
            'This find could not load.',
            retry: () => setState(
              () => _product = widget.runtime.catalog!.findBySlug(widget.slug),
            ),
          );
        }
        if (snapshot.connectionState != ConnectionState.done) {
          return message('Loading the details…');
        }
        final p = snapshot.data;
        if (p == null) return message('This product is unavailable.');
        variant ??= p.variants.firstOrNull?.id;
        return ListView(
          padding: const EdgeInsets.all(24),
          children: [
            SizedBox(height: 250, child: ProductArt(widget.runtime, p)),
            const SizedBox(height: 24),
            Text(p.name, style: Theme.of(context).textTheme.headlineLarge),
            Text(p.description),
            const SizedBox(height: 24),
            DropdownButtonFormField<String>(
              initialValue: variant,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Choose your finish',
              ),
              items: p.variants
                  .map(
                    (v) => DropdownMenuItem(
                      value: v.id,
                      child: Text(
                        '${v.label} · ${money(v.priceKobo)}',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  )
                  .toList(),
              onChanged: busy
                  ? null
                  : (value) => setState(() => variant = value),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              initialValue: quantity,
              decoration: const InputDecoration(labelText: 'Quantity'),
              items: List.generate(
                10,
                (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1}')),
              ),
              onChanged: busy
                  ? null
                  : (value) => setState(() => quantity = value!),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: busy || variant == null
                  ? null
                  : () => action(context, () async {
                      setState(() => busy = true);
                      try {
                        await widget.runtime.cart!.add(
                          variant!,
                          quantity: quantity,
                        );
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Saved to your bag.')),
                          );
                        }
                      } finally {
                        if (mounted) setState(() => busy = false);
                      }
                    }),
              child: Text(busy ? 'Saving…' : 'Add to bag'),
            ),
            const SizedBox(height: 24),
            const Text(
              'The details',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            for (final entry in p.specifications.entries)
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(entry.key),
                subtitle: Text(
                  entry.value is List
                      ? (entry.value as List).join(', ')
                      : '${entry.value}',
                ),
              ),
          ],
        );
      },
    );
  }
}

class CartScreen extends StatefulWidget {
  final AppRuntime runtime;
  const CartScreen(this.runtime, {super.key});
  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  @override
  void initState() {
    super.initState();
    unawaited(widget.runtime.cart!.refresh().catchError((_) {}));
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.runtime.cart!;
    return RefreshIndicator(
      onRefresh: c.refresh,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Your good things.',
            style: Theme.of(context).textTheme.headlineLarge,
          ),
          const SizedBox(height: 16),
          if (c.loading) const LinearProgressIndicator(),
          if (c.error != null) ...[
            Text(c.error!.message),
            TextButton(
              onPressed: () => action(context, c.refresh),
              child: const Text('Retry loading bag'),
            ),
          ],
          if (c.reviewRequired)
            OutlinedButton(
              onPressed: () => action(context, () async {
                await c.refresh();
                c.acknowledgeReview();
              }),
              child: const Text('Review latest bag and continue'),
            ),
          if (c.cart.lines.isEmpty && !c.loading && c.error == null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Text(
                'Your bag is empty. Find your next favorite in the collection.',
              ),
            ),
          for (final line in c.cart.lines)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      line.productName,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(line.variantLabel),
                    Text(money(line.totalKobo)),
                    if (!line.active)
                      const Text('Unavailable — remove before checkout.'),
                    Row(
                      children: [
                        IconButton(
                          tooltip: 'Decrease ${line.productName}',
                          onPressed: c.saving || c.reviewRequired
                              ? null
                              : () => action(
                                  context,
                                  () => c.setQuantity(
                                    line.variantId,
                                    line.quantity - 1,
                                  ),
                                ),
                          icon: const Icon(Icons.remove),
                        ),
                        Text('${line.quantity}'),
                        IconButton(
                          tooltip: 'Increase ${line.productName}',
                          onPressed:
                              c.saving ||
                                  c.reviewRequired ||
                                  line.quantity >= 10
                              ? null
                              : () => action(
                                  context,
                                  () => c.setQuantity(
                                    line.variantId,
                                    line.quantity + 1,
                                  ),
                                ),
                          icon: const Icon(Icons.add),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: c.saving || c.reviewRequired
                              ? null
                              : () => action(
                                  context,
                                  () => c.setQuantity(line.variantId, 0),
                                ),
                          child: const Text('Remove'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 20),
          Text(
            'Subtotal: ${money(c.cart.subtotalKobo)}',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const Text('Demo delivery is calculated at checkout.'),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: c.cart.lines.isEmpty || c.reviewRequired || c.saving
                ? null
                : () => action(context, () async {
                    await c.flushPending();
                    if (!context.mounted) return;
                    context.go(
                      widget.runtime.auth!.isGoogle
                          ? '/checkout'
                          : '/signin?returnTo=/checkout',
                    );
                  }),
            child: const Text('Continue to demo checkout'),
          ),
        ],
      ),
    );
  }
}

class SignInScreen extends StatelessWidget {
  final AppRuntime runtime;
  final String returnTo;
  const SignInScreen(this.runtime, {this.returnTo = '/account', super.key});
  @override
  Widget build(BuildContext context) {
    final auth = runtime.auth!;
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          'Your bag comes with you.',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 12),
        const Text(
          'Continue with Google to save your bag across devices and view your demo orders.',
        ),
        const SizedBox(height: 24),
        if (auth.error != null) Text(auth.error!.message),
        if (auth.waitingForGoogle)
          const Text(
            'Finish sign-in in your browser. If you canceled, restore your guest bag below.',
          ),
        FilledButton(
          onPressed: auth.waitingForGoogle
              ? null
              : () => action(context, () => auth.beginGoogle(returnTo)),
          child: const Text('Continue with Google'),
        ),
        if (auth.waitingForGoogle)
          OutlinedButton(
            onPressed: () => action(context, () async {
              await auth.cancelGoogle();
              if (context.mounted) context.go('/cart');
            }),
            child: const Text('Restore guest bag'),
          ),
        if (auth.isGoogle)
          TextButton(
            onPressed: () => context.go('/account'),
            child: const Text('View your account'),
          ),
      ],
    );
  }
}

class TransferScreen extends StatefulWidget {
  final AppRuntime runtime;
  const TransferScreen(this.runtime, {super.key});
  @override
  State<TransferScreen> createState() => _TransferScreenState();
}

class _TransferScreenState extends State<TransferScreen> {
  Future<TransferReview>? _review;
  @override
  Widget build(BuildContext context) {
    final auth = widget.runtime.auth!;
    _review ??= auth.reviewTransfer();
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          'A little bag review.',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const Text(
          'Both bags are saved. Reduce guest quantities or remove unavailable items before combining them.',
        ),
        if (auth.error != null) Text(auth.error!.message),
        FutureBuilder<TransferReview>(
          future: _review,
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return message(
                'Could not load both bags. Your recovery is preserved.',
                retry: () => setState(() => _review = auth.reviewTransfer()),
              );
            }
            if (!snapshot.hasData) return message('Loading both saved bags…');
            final review = snapshot.data!;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Guest bag',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                for (final line in review.guest.lines)
                  ListTile(
                    title: Text(line.productName),
                    subtitle: Text('${line.variantLabel} · ${line.quantity}'),
                    trailing: IconButton(
                      tooltip: 'Reduce guest ${line.productName}',
                      icon: const Icon(Icons.remove_circle_outline),
                      onPressed: () => action(context, () async {
                        await auth.reviseGuest(
                          line.variantId,
                          line.quantity - 1,
                          review.guest.revision,
                          (session, id, q, r) => widget.runtime.api!.updateCart(
                            variantId: id,
                            quantity: q,
                            expectedRevision: r,
                            sessionOverride: session,
                          ),
                        );
                        setState(() => _review = auth.reviewTransfer());
                      }),
                    ),
                  ),
                const Text(
                  'Account bag',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                for (final line in review.account.lines)
                  ListTile(
                    title: Text(line.productName),
                    subtitle: Text('${line.variantLabel} · ${line.quantity}'),
                  ),
              ],
            );
          },
        ),
        FilledButton(
          onPressed: () => action(context, () async {
            await auth.retryTransfer();
            if (auth.needsTransferReview && mounted) {
              setState(() => _review = auth.reviewTransfer());
            }
          }),
          child: const Text('Combine bags and continue'),
        ),
        TextButton(
          onPressed: () => action(context, () async {
            await auth.cancelGoogle();
            if (context.mounted) context.go('/cart');
          }),
          child: const Text('Restore guest bag instead'),
        ),
      ],
    );
  }
}

class CheckoutScreen extends StatefulWidget {
  final AppRuntime runtime;
  const CheckoutScreen(this.runtime, {super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final form = GlobalKey<FormState>();
  final name = TextEditingController(),
      city = TextEditingController(),
      address = TextEditingController();
  bool consent = false, loading = true;
  String? error;
  @override
  void initState() {
    super.initState();
    unawaited(_load());
  }

  Future<void> _load() async {
    if (!widget.runtime.auth!.isGoogle) {
      if (mounted) setState(() => loading = false);
      return;
    }
    try {
      final recovered = await widget.runtime.checkout!.recoverPending();
      if (recovered != null && mounted) {
        context.go('/receipt/${recovered.id}');
        return;
      }
      await widget.runtime.cart!.flushPending();
      await widget.runtime.checkout!.loadQuote();
      error = null;
    } catch (e) {
      error = e.toString();
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  void dispose() {
    name.dispose();
    city.dispose();
    address.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.runtime.auth!.isGoogle) {
      return SignInScreen(widget.runtime, returnTo: '/checkout');
    }
    final c = widget.runtime.checkout!;
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          'Make it yours.',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const Text(
          'Use fictional delivery details. No card. No charge. No shipment.',
        ),
        if (loading) const LinearProgressIndicator(),
        if (error != null) Text(error!),
        if (c.hasPending)
          const Text(
            'A previous request is unresolved. Retrying uses its original saved details and request key.',
          ),
        if (c.stale)
          const Text(
            'Your bag or prices changed. Review a fresh quote before placing your demo order.',
          ),
        OutlinedButton(
          onPressed: c.busy
              ? null
              : () => action(context, () async {
                  if (c.hasPending) {
                    final recovered = await c.recoverPending();
                    if (recovered != null) {
                      if (context.mounted) {
                        context.go('/receipt/${recovered.id}');
                      }
                      return;
                    }
                    if (c.rejectedPending) await c.resolveRejectedPending();
                  }
                  await _load();
                }),
          child: const Text('Review latest total'),
        ),
        if (c.currentQuote != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Subtotal: ${money(c.currentQuote!.subtotalKobo)}'),
                Text('Demo delivery: ${money(c.currentQuote!.deliveryKobo)}'),
                Text(
                  'Demo total: ${money(c.currentQuote!.totalKobo)}',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
          ),
        Form(
          key: form,
          child: Column(
            children: [
              TextFormField(
                controller: name,
                maxLength: 100,
                decoration: const InputDecoration(
                  labelText: 'Fictional recipient name',
                ),
                validator: (s) => (s?.trim().length ?? 0) < 2
                    ? 'Enter at least 2 characters.'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: city,
                maxLength: 100,
                decoration: const InputDecoration(labelText: 'Demo city'),
                validator: (s) => (s?.trim().length ?? 0) < 2
                    ? 'Enter at least 2 characters.'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: address,
                maxLength: 300,
                minLines: 2,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Fictional address',
                ),
                validator: (s) => (s?.trim().length ?? 0) < 5
                    ? 'Enter at least 5 characters.'
                    : null,
              ),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: consent,
                onChanged: c.busy
                    ? null
                    : (value) => setState(() => consent = value!),
                title: const Text(
                  'I understand this is a demo order with no payment or shipment.',
                ),
              ),
              FilledButton(
                onPressed:
                    c.busy ||
                        !consent ||
                        (!c.hasPending && (c.currentQuote == null || c.stale))
                    ? null
                    : () => action(context, () async {
                        if (!c.hasPending && !form.currentState!.validate()) {
                          return;
                        }
                        final order = await c.submit(
                          Delivery(name.text, city.text, address.text),
                          demoConsent: consent,
                        );
                        unawaited(
                          widget.runtime.cart!.refresh().catchError((_) {}),
                        );
                        if (context.mounted) context.go('/receipt/${order.id}');
                      }),
                child: Text(
                  c.busy
                      ? 'Saving demo order…'
                      : c.hasPending
                      ? 'Recover or retry saved request'
                      : 'Place demo order',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class OrdersScreen extends StatefulWidget {
  final AppRuntime runtime;
  const OrdersScreen(this.runtime, {super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  Future<List<DemoOrder>>? _orders;
  int generation = -1;
  @override
  Widget build(BuildContext context) {
    final auth = widget.runtime.auth!;
    if (!auth.isGoogle) return SignInScreen(widget.runtime);
    final next =
        widget.runtime.ordersGeneration + auth.sessionGeneration * 100000;
    if (generation != next) {
      generation = next;
      _orders = widget.runtime.orders();
    }
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          'Your good things.',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        Text(auth.session!.user.email ?? ''),
        TextButton(
          onPressed: () => action(context, () async {
            await auth.signOut();
            if (context.mounted) context.go('/');
          }),
          child: const Text('Sign out on this phone'),
        ),
        const Text(
          'Your latest demo orders',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        FutureBuilder<List<DemoOrder>>(
          key: ValueKey(next),
          future: _orders,
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return message(
                'Your orders could not load.',
                retry: () => setState(() => _orders = widget.runtime.orders()),
              );
            }
            if (!snapshot.hasData) {
              return message('Loading your private orders…');
            }
            if (snapshot.data!.isEmpty) return message('No demo orders yet.');
            return Column(
              children: [
                for (final order in snapshot.data!)
                  Card(
                    child: ListTile(
                      title: Text(order.reference),
                      subtitle: Text(
                        '${order.createdAt.toLocal().year}-${order.createdAt.toLocal().month}-${order.createdAt.toLocal().day} · Demo confirmed',
                      ),
                      trailing: Text(money(order.totalKobo)),
                      onTap: () => context.go('/receipt/${order.id}'),
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class ReceiptScreen extends StatefulWidget {
  final AppRuntime runtime;
  final String id;
  const ReceiptScreen(this.runtime, this.id, {super.key});
  @override
  State<ReceiptScreen> createState() => _ReceiptScreenState();
}

class _ReceiptScreenState extends State<ReceiptScreen> {
  Future<DemoOrder>? _order;
  Timer? timer;
  int attempt = 0;
  int generation = -1;
  void _load() {
    timer?.cancel();
    _order = widget.runtime.order(widget.id);
    _order!.then((order) {
      if (!mounted || !widget.runtime.auth!.isGoogle) return;
      if (!['accepted', 'failed'].contains(order.emailStatus) && attempt < 4) {
        final delay = [5, 10, 20, 30][attempt++];
        timer = Timer(Duration(seconds: delay), () {
          if (mounted && widget.runtime.auth!.isGoogle) setState(_load);
        });
      }
    }, onError: (Object _) {});
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = widget.runtime.auth!;
    if (!auth.isGoogle) {
      timer?.cancel();
      return SignInScreen(widget.runtime, returnTo: '/receipt/${widget.id}');
    }
    if (generation != auth.sessionGeneration) {
      generation = auth.sessionGeneration;
      _load();
    }
    return FutureBuilder<DemoOrder>(
      key: ValueKey(generation),
      future: _order,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return message(
            'This private receipt could not be found or loaded.',
            retry: () => setState(_load),
          );
        }
        if (!snapshot.hasData) return message('Loading your private receipt…');
        final order = snapshot.data!;
        return ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Icon(
              Icons.check_circle_outline,
              size: 64,
              color: Color(0xFF7658D9),
            ),
            Text(
              'Good things, all wrapped up.',
              style: Theme.of(context).textTheme.headlineLarge,
            ),
            const Text('No payment was collected. No shipment will occur.'),
            const SizedBox(height: 20),
            Text(
              order.reference,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            for (final line in order.items)
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(line.productName),
                subtitle: Text('${line.variantLabel} · ${line.quantity}'),
                trailing: Text(money(line.totalKobo)),
              ),
            Text('Subtotal: ${money(order.subtotalKobo)}'),
            Text('Demo delivery: ${money(order.deliveryKobo)}'),
            Text(
              'Demo total: ${money(order.totalKobo)}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 20),
            Text(switch (order.emailStatus) {
              'accepted' => 'Confirmation email requested. Provider acceptance does not guarantee inbox delivery.',
              'failed' => 'Your order is saved. The confirmation email could not be sent.',
              'processing' => 'Confirmation email is being requested.',
              'retrying' => 'Confirmation email is being retried.',
              _ => 'Confirmation email queued.',
            }),
            TextButton(
              onPressed: () => context.go('/account'),
              child: const Text('View your orders'),
            ),
          ],
        );
      },
    );
  }
}
